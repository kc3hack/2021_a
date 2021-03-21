/*!
 * gif.js ver 0.8.1 (2020-06-10)
 * (c) katwat (katwat.s1005.xrea.com)
 * based on http://slbkbs.org/jsgif/
 * The MIT License
 */
(function(definition) {
	Gif = definition();
})(function() {
	var workerFunc = function() {
		var _pt,
			BLOCKTYPE_EXT = 0x21, // '!'
			BLOCKTYPE_IMG = 0x2c, // ','
			BLOCKTYPE_EOF = 0x3b,  // ';'
			EXTTYPE_GCE = 0xf9, // Graphic Control Extension
			EXTTYPE_COM = 0xfe, // Comment Extension
			EXTTYPE_PTE = 0x01, // Plain Text Extension
			EXTTYPE_APP = 0xff,  // Application Extension
			that = this;

		this.onmessage = function(msg) {
			var result;
			msg = msg.data;
			if (msg.type === 'parse') {
				try {
					result = parse(msg.buf);
					this.postMessage({
						type: 'parse',
						result: result
					});
				} catch(e) {
					this.postMessage({
						type: 'error',
						error: e.toString()
					});
				}
			}
		};

		function Stream(buf) {
			this.data = new DataView(buf);
			this.pos = 0;
		}
		_pt = Stream.prototype;
		_pt.readUint8 = function() {
			var pos = this.pos;
			this.pos += 1;
			return this.data.getUint8(pos);
		};
		_pt.readUint16 = function() {
			var pos = this.pos;
			this.pos += 2;
			return this.data.getUint16(pos,true); // little endian
		};
		_pt.readBytes = function(len) {
			var pos = this.pos;
			this.pos += len;
			return new Uint8Array(this.data.buffer,pos,len);
		};
		_pt.readString = function(len) {
			// !!! ASCII code only !!!
			return String.fromCharCode.apply(undefined,this.readBytes(len));
		};

		function parseCT(st,entries) { // color table : Each entry is 3 bytes, for RGB.
			var ct = [];
			while (entries--) {
				ct.push(st.readBytes(3));
			}
			return ct;
		}

		function Header(st) {
			var flags;
			if (st.readString(3) !== 'GIF') {
				throw new Error('not gif');
			}
			this.ver = st.readString(3); // '87a' or '89a'
			this.width = st.readUint16();
			this.height = st.readUint16();
			flags = st.readUint8();
			this.gctSize = flags & 0x07; flags >>>= 3;
			this.sorted = flags & 0x01; flags >>>= 1;
			this.colorRes = flags & 0x07; flags >>>= 3;
			this.gctFlag = flags & 0x01;
			this.bg = st.readUint8(); // color index of gct
			this.pixelAspectRatio = st.readUint8(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64
			if (this.gctFlag) {
				this.gct = parseCT(st,1 << (this.gctSize + 1));
			} else {
				this.gct = null;
			}
			//handler.hdr && handler.hdr(this);
		}

		function concatBytes(a,b) {
			var c = new Uint8Array(a.length + b.length);
			c.set(a);
			c.set(b,a.length);
			return c;
		}

		function readSubBlocks(st) {
			var data,size;
			data = new Uint8Array(0); // zero length
			while ((size = st.readUint8()) > 0) {
				data = concatBytes(data,st.readBytes(size));
			}
			return data;
		}

		function GCExt(st) {
			var flags;
			this.blockType = BLOCKTYPE_EXT;
			this.extType = EXTTYPE_GCE;
			st.readUint8(); // block size (always 4)
			flags = st.readUint8();
			this.transparencyGiven = flags & 0x01; flags >>>= 1;
			this.userInput = flags & 0x01; flags >>>= 1;
			this.disposalMethod = flags & 0x07; flags >>>= 3;
			//this.reserved = flags & 0x07; // Reserved; should be 000.
			this.delayTime = st.readUint16();
			this.transparencyIndex = st.readUint8();
			st.readUint8(); // terminator
			//handler.gce && handler.gce(this);
		}

		function ComExt(st) {
			this.blockType = BLOCKTYPE_EXT;
			this.extType = EXTTYPE_COM;
			this.comment = readSubBlocks(st);
			//handler.com && handler.com(this);
		}

		function PTExt(st) {
			// No one *ever* uses this. If you use it, deal with parsing it yourself.
			this.blockType = BLOCKTYPE_EXT;
			this.extType = EXTTYPE_PTE;
			this.ptHeader = st.readBytes(st.readUint8()); // block size (always 12)
			this.ptData = readSubBlocks(st);
			//handler.pte && handler.pte(block);
		}

		function AppExt(st) {
			this.blockType = BLOCKTYPE_EXT;
			this.extType = EXTTYPE_APP;
			st.readUint8(); // block size (always 11)
			this.identifier = st.readString(8);
			this.authCode = st.readString(3);
			switch (this.identifier) {
			case 'NETSCAPE':
				st.readUint8(); // block size (always 3)
				st.readUint8(); // ??? Always 1 ? What is this?
				this.iterations = st.readUint16(); // animation loop count
				st.readUint8(); // terminator
				//handler.app && handler.app.NETSCAPE && handler.app.NETSCAPE(this);
				break;
			default:
				this.appData = readSubBlocks(st);
				// FIXME: This won't work if a handler wants to match on any identifier.
				//handler.app && handler.app[block.identifier] && handler.app[block.identifier](this);
				break;
			}
		}

		function UnknownExt(st,extType) {
			this.blockType = BLOCKTYPE_EXT;
			this.extType = extType;
			this.data = readSubBlocks(st);
			//handler.unknown && handler.unknown(this);
		}

		function parseExt(st) {
			var extType = st.readUint8();
			switch (extType) {
			case EXTTYPE_GCE: // 0xF9
				return new GCExt(st);
			case EXTTYPE_COM: // 0xFE
				return new ComExt(st);
			case EXTTYPE_PTE: // 0x01
				return new PTExt(st);
			case EXTTYPE_APP: // 0xFF
				return new AppExt(st);
			default:
				return new UnknownExt(st,extType);
			}
		}

		function lzwDecode(minCodeSize, data) {
			// TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
			var pos = 0, // Maybe this streaming thing should be merged with the Stream?
				output = [],
				clearCode = 1 << minCodeSize,
				eoiCode = clearCode + 1,
				codeSize = minCodeSize + 1,
				dict,
				code,
				last;

			while (true) {
				last = code;
				code = readCode(codeSize);

				if (code === clearCode) {
					clear();
					continue;
				}
				if (code === eoiCode) break;

				if (code < dict.length) {
					if (last !== clearCode) {
						dict.push(dict[last].concat(dict[code][0]));
					}
				} else {
					if (code !== dict.length) throw new Error('Invalid LZW code');
					dict.push(dict[last].concat(dict[last][0]));
				}
				output.push.apply(output, dict[code]);

				if (dict.length === (1 << codeSize) && codeSize < 12) {
					// If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
					codeSize++;
				}
			}

			// I don't know if this is technically an error, but some GIFs do it.
			//if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
			return new Uint8Array(output);

			function readCode(size) {
				var i,code = 0;
				for (i = 0; i < size; i++) {
					if (data[pos >>> 3] & (1 << (pos & 7))) {
						code |= 1 << i;
					}
					pos++;
				}
				return code;
			}

			function clear() {
				var i;
				dict = new Array(eoiCode + 1); //dict = [];
				codeSize = minCodeSize + 1;
				for (i = 0; i < clearCode; i++) {
					dict[i] = [i];
				}
				dict[clearCode] = [];
				dict[eoiCode] = null;
			}
		}

		function deinterlace(pixels, width) {
			// Of course this defeats the purpose of interlacing. And it's *probably*
			// the least efficient way it's ever been implemented. But nevertheless...
			var newPixels = new Uint8Array(pixels.length),
				rows = pixels.length / width,

				// See appendix E.
				offsets = [0, 4, 2, 1],
				steps = [8, 8, 4, 2],

				fromRow = 0,
				pass,
				toRow;

			for (pass = 0; pass < 4; pass++) {
				for (toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
					cpRow(toRow, fromRow);
					//newPixels.set(new Uint8Array(pixels.buffer,fromRow*width,width),toRow*width);
					fromRow++;
				}
			}
			return newPixels;

			function cpRow(toRow, fromRow) {
				var from,to,i;
				from = fromRow * width;
				to = toRow * width;
				for (i = 0; i < width; i++) {
					newPixels[to + i] = pixels[from + i];
				}
			}
		}

		function ImgBlock(st,gce) {
			var flags;
			this.blockType = BLOCKTYPE_IMG;
			this.gce = gce;
			this.left = st.readUint16();
			this.top = st.readUint16();
			this.width = st.readUint16();
			this.height = st.readUint16();
			flags = st.readUint8();
			this.lctSize = flags & 0x07; flags >>>= 3;
			/* this.reserved = flags & 0x03; */ flags >>>= 2;
			this.sorted = flags & 0x01; flags >>>= 1;
			this.interlaced = flags & 0x01; flags >>>= 1;
			this.lctFlag = flags & 0x01;
			if (this.lctFlag) {
				this.lct = parseCT(st,1 << (this.lctSize + 1));
			} else {
				this.lct = null;
			}
			this.pixels = lzwDecode(st.readUint8(), readSubBlocks(st));
			if (this.interlaced) {
				this.pixels = deinterlace(this.pixels, this.width);
			}
			//handler.img && handler.img(this);
			progress(st.pos,st.data.buffer.byteLength);
		}

		function parseBlock(st,gce) {
			var blockType = st.readUint8();
			switch (blockType) {
			case BLOCKTYPE_EXT: // 0x21
				return parseExt(st);
			case BLOCKTYPE_IMG: // 0x2c
				return new ImgBlock(st,gce);
			case BLOCKTYPE_EOF: // 0x3b
	        	//handler.eof && handler.eof();
				return null;
			default:
				throw new Error('unknown block');
			}
		}

		function parse(buf) { // buf: ArrayBuffer
			var st,block,gce,header,blocks;
			st = new Stream(buf);
			header = new Header(st);
			blocks = [];
			gce = null;
			while ((block = parseBlock(st,gce))) {
				if (block.blockType === BLOCKTYPE_EXT && block.extType === EXTTYPE_GCE) {
					gce = block;
				}
				blocks.push(block);
			}
			progress(st.pos,st.data.buffer.byteLength); // always 100%
			return {
				header: header,
				blocks: blocks
			};
		}

		function progress(loaded,total) {
			that.postMessage({
				type: 'progress',
				progress: {
					loaded: loaded,
					total: total
				}
			});
		}
	},_pt;

	function createFunctionURL(fn) {
		// http://qiita.com/mohayonao/items/872166cf364e007cf83d
		var fnBody = fn.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
		return URL.createObjectURL(new Blob([fnBody], {type:'application/javascript'}));
		// URL.revokeObjectURL() if dispose
	}

	function createCanvasImage(image) {
		var canvas;
		canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		canvas.getContext('2d').putImageData(image,0,0);
		return canvas;
	}

	// GIF Image Translator
	function Gif() {
		this.header = null;
		this.blocks = null;
		this.backgroundColor = new Uint8Array(new ArrayBuffer(4)); // for pre-rendering
	}
	_pt = Gif.prototype;
	_pt.parse = function(buf,onparse,onerror,onprogress) { // buf: ArrayBuffer
		var that = this,
			url = createFunctionURL(workerFunc),
			worker = new Worker(url);
		worker.onmessage = function(msg) {
			msg = msg.data;
			switch(msg.type) {
			case 'parse':
				that.header = msg.result.header;
				that.blocks = msg.result.blocks;
				dispose();
				onparse(that);
				break;
			case 'error':
				dispose();
				if (onerror) {
					onerror(msg.error);
				}
				break;
			case 'progress':
				if (onprogress) { 
					onprogress(msg.progress); // {loaded: number, total: number}
				}
				break;
			}
		};
		worker.postMessage({type:'parse',buf:buf},[buf]); // transfer arrayBuffer

		function dispose() {
			worker.terminate();
			URL.revokeObjectURL(url);
		}
	};
	_pt.createFrameImage = function(canvasContext, imgBlock, drawable) {
		var img,data/*,bg*/,gct,ct,gce,transparency,pixels,l,i,pixel,idx;
		img = canvasContext.createImageData(imgBlock.width, imgBlock.height); // transparent black
		data = img.data;
		//bg = this.header.bg;
		gct = this.header.gct;
		ct = imgBlock.lctFlag ? imgBlock.lct : gct; // color table
		gce = imgBlock.gce;
		if (gce) {
			if (gce.transparencyGiven) {
				transparency = gce.transparencyIndex;
			}
		}
		pixels = imgBlock.pixels;
		l = pixels.length;
		for (i=0;i<l;i++) {
			pixel = pixels[i];
			if (pixel !== transparency) {
				// RGBA8888
				pixel = ct[pixel];
				idx = i << 2;
				data[idx  ] = pixel[0];
				data[idx+1] = pixel[1];
				data[idx+2] = pixel[2];
				data[idx+3] = 255; // opaque
			}
		}
		return drawable ? createCanvasImage(img) : img;
	};
	// http://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q1296272602
	// http://g-dragon.life.coocan.jp/gif/gif6.html
	// http://www.theimage.com/animation/pages/disposal2.html ここが分かりやすい。
	/*
	Disposal Method:
	0 - No disposal specified.
		The decoder is not required to take any action.
	1 - Do not dispose. The graphic is to be left in place.
	2 - Restore to background color.
		The area used by the graphic must be restored to the background color.
	3 - Restore to previous. 
		The decoder is required to restore the area overwritten 
		by the graphic with what was there prior to rendering the graphic.
	*/
	_pt.createFrameImages = function(canvasContext,preRendering,drawable) {
		var that,frames,w,h,bg,lastDisposal,noDisposal,img;
		if (!this.blocks) {
			return null;
		}
		that = this;
		frames = [];
		this.blocks.forEach(function(block) {
			if (block.blockType === 0x2c) { // BLOCKTYPE_IMG
				frames.push({
					delay: block.gce ? block.gce.delayTime : 0, // 1/100s
					disposalMethod: block.gce ? block.gce.disposalMethod : 0,
					left: block.left,
					top: block.top,
					image: that.createFrameImage(canvasContext, block, preRendering || drawable)
				});
			}
		});
		if (preRendering) {
			// generate rendered image
			// disposal method は pre-rendering モードでのみ対応する。
			w = this.header.width;
			h = this.header.height;
			bg = document.createElement('canvas');
			bg.width = w;
			bg.height = h;
			bg = bg.getContext('2d');
			bg.fillStyle = 'rgba(' + this.backgroundColor[0] + ',' + this.backgroundColor[1] + ',' + this.backgroundColor[2] + ',' + (this.backgroundColor[3]/255) + ')';
			bg.fillRect(0,0,w,h);
			lastDisposal = 0;
			frames.forEach(function(frame) {
				if (lastDisposal === 2 || lastDisposal === 3) {
					bg.clearRect(0,0,w,h); // これやらんとダメっぽい。
					bg.fillRect(0,0,w,h);
				}
				if (lastDisposal === 3 && noDisposal) {
					bg.drawImage(noDisposal.image,noDisposal.left,noDisposal.top);
				}
				bg.drawImage(frame.image,frame.left,frame.top);
				if (frame.disposalMethod === 1) {
					// 覚えておく
					noDisposal = {
						image: frame.image,
						left: frame.left,
						top: frame.top
					};
				}
				lastDisposal = frame.disposalMethod;

				img = bg.getImageData(0,0,w,h);
				frame.image = drawable ? createCanvasImage(img) : img;
				frame.left = 0;
				frame.top = 0;
			});
		}
		return frames;
	};
	return Gif;
});

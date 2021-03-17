/**
 * 人間の言葉を犬語に変換します
 * @param {string} sentence - 変換したい日本語の文章
 * @returns {string} 犬語を返却
 */
function ja2dogLang(sentence) {
    const kuromoji = require('kuromoji');
    const builder = kuromoji.builder({
        dicPath: 'node_modules/kuromoji/dict'
    })
    let dogLangSentence = "";
    builder.build(function(err, tokenizer) {
        if(err){throw err}
        const tokens = tokenizer.tokenize(sentence);
        //console.dir(tokens); // 形態素解析結果を表示
        const tokensTrans = tokens.map((token)=> {
            // ##--- transform rule ---##
            if (token.pos_detail_1 === "句点") return "わん" + token.surface_form;
            return token.surface_form;
        })
        dogLangSentence = tokensTrans.join("");
        // console.log(dogLangSentence); 犬語の結果を表示
    })
    return dogLangSentence;
}

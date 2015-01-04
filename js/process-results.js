function onMwsAnswer($results_display, mws_answer) {
    $results_display.append(
        $('<div style="width:800px; margin-left:auto; margin-right:auto; text-align:center;"/>').append(mws_answer));
}

function beforeMwsAnswers($results_display) {
    $results_display.html("");
}

function afterMwsAnswers($results_display) {
    MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
}

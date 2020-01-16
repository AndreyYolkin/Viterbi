import { Viterbi } from "./src/Viterbi";
import "@babel/polyfill";
import jquery from "jquery";
import { Drawer } from "./src/draw";
import Test from "./src/Viterbi.browser.test";
import { default as bootstrapToggle } from "bootstrap4-toggle";
import "bootstrap"
 
window.$ = window.jQuery = jquery;

$(document).ready(() => {
    $('#viterbiToggle').bootstrapToggle();
    $("form").submit((e) => {
        e.preventDefault();
        const button = $("button[type=submit][clicked=true]");
        const data = [...e.target];
        const viterbi = new Viterbi(...data.map(a => a.value).slice(0, 2));
        if (viterbi instanceof Error) {
            const message =
                $(`<div class="alert alert-danger alert-dismissible" role="alert" style="display: none">
              <span>${viterbi.message}</span>
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>`)
            $(".alertplace").append(message);
            $(message).fadeIn().delay(1800).fadeOut(500);
        }
        else if (button.attr("id") == "calc") {
            if (data[3].checked) {
                viterbi.encode(data[2].value).then((result) => {
                    const { transitions, constraint, paths, metrics } = viterbi.get(),
                        input = data[2].value,
                        output = result,
                        isEncode = data[3].checked;
                    const drawer = new Drawer(transitions, constraint, input, output, paths, metrics, isEncode);

                    $("#Modal .inputValue").text(input);
                    $("#Modal .outputCaption").text("Закодированная строка");
                    $("#Modal .outputValue").text(result);
                    $("#Modal #grid").hide();
                    $("#Modal").modal();

                    $('#Modal').on('shown.bs.modal', () => {
                        drawer.run("auto", null);
                    })
                    $("#Modal .topdf").hide();
                }, (error) => {
                    const message =
                        $(`<div class="alert alert-danger alert-dismissible" role="alert" style="display: none">
              <span>${error.message}</span>
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>`)
                    $(".alertplace").append(message);
                    $(message).fadeIn().delay(1800).fadeOut(500);
                });
            }
            else {
                viterbi.decode(data[2].value).then((result) => {
                    const { transitions, constraint, paths, metrics } = viterbi.get(),
                        input = data[2].value,
                        output = result,
                        isEncode = data[3].checked;
                    const drawer = new Drawer(transitions, constraint, input, output, paths, metrics, isEncode);

                    $("#Modal .inputValue").text(input);
                    $("#Modal .outputCaption").text("Раскодированная строка");
                    $("#Modal .outputValue").text(result);
                    $("#Modal #grid").show();
                    $("#Modal").modal();

                    $('#Modal').on('shown.bs.modal', () => {
                        drawer.run("auto", "grid");
                    })
                    $("#Modal .topdf").show();
                    $("#Modal .topdf").click(() => drawer.getimage());
                }, (error) => {
                    const message =
                        $(`<div class="alert alert-danger alert-dismissible" role="alert" style="display: none">
              <span>${error.message}</span>
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>`)
                    $(".alertplace").append(message);
                    $(message).fadeIn().delay(1800).fadeOut(500);
                });
            }

        }
        else if (button.attr("id") == "test") {
            const test = new Test(viterbi);
            test.runTests(1000);
            $("#Test").modal();
        }
        return false;
    })

    $("form button[type=submit]").click(function () {
        $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr("clicked", "true");
    });
})
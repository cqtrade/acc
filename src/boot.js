const { flow } = require('./flow')

function boot() {
    console.log("start");
    setTimeout(() => {
        flow()
            .then()
            .catch((e) => {
                console.log("Exception", e);
            })
            .finally(() => boot())
    }, 1000)
}

exports.boot = boot 

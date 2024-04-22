//var eosjs_numeric_1 = require("eosjs/dist/eosjs-numeric");

class RpcError extends Error {
    constructor(json) {
        super(); // Call to the parent class's constructor

        if (json.error && json.error.details && json.error.details.length && json.error.details[0].message) {
            let errorMessage = json.error.details[0].message;
            // Errors typically have multiple messages
            if (json.error.details.length > 1) {
                for (let i = 1; i < json.error.details.length; i++) {
                    errorMessage += '\n' + json.error.details[i].message;
                }
            }
            this.message = errorMessage;
        } else if (json.processed && json.processed.except && json.processed.except.message) {
            this.message = json.processed.except.message;
        } else {
            this.message = json.message;
        }

        Object.setPrototypeOf(this, RpcError.prototype);
        this.json = json;
    }
}

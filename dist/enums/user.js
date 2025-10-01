"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUS = exports.USER_ROLES = void 0;
var USER_ROLES;
(function (USER_ROLES) {
    USER_ROLES["SUPER_ADMIN"] = "SUPER_ADMIN";
    USER_ROLES["POSTER"] = "POSTER";
    USER_ROLES["TASKER"] = "TASKER";
    USER_ROLES["GUEST"] = "GUEST";
})(USER_ROLES || (exports.USER_ROLES = USER_ROLES = {}));
var USER_STATUS;
(function (USER_STATUS) {
    USER_STATUS["ACTIVE"] = "ACTIVE";
    USER_STATUS["INACTIVE"] = "INACTIVE";
    USER_STATUS["RESTRICTED"] = "RESTRICTED";
    USER_STATUS["DELETE"] = "DELETE";
})(USER_STATUS || (exports.USER_STATUS = USER_STATUS = {}));

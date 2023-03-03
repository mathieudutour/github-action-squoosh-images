"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const promises_1 = __importDefault(require("fs/promises"));
const lib_1 = require("@squoosh/lib");
const os_1 = require("os");
const imagePool = new lib_1.ImagePool((0, os_1.cpus)().length);
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const images = core
            .getInput("images", {
            required: true,
            trimWhitespace: true,
        })
            .split(",")
            .map((x) => x.trim());
        for (const imagePath of images) {
            try {
                const file = yield promises_1.default.readFile(imagePath);
                const array = new Uint8Array(file);
                const firstChunk = array.slice(0, 16);
                const firstChunkString = Array.from(firstChunk)
                    .map((v) => String.fromCodePoint(v))
                    .join("");
                const encoderKey = (_a = Object.entries(lib_1.encoders).find(([_name, { detectors }]) => detectors.some((detector) => detector.exec(firstChunkString)))) === null || _a === void 0 ? void 0 : _a[0];
                if (!encoderKey) {
                    core.info(`Skipping ${imagePath} as there is no matching encoder`);
                    continue;
                }
                const image = imagePool.ingestImage(file);
                yield image.encode({
                    [encoderKey]: {},
                });
                // @ts-ignore
                yield promises_1.default.writeFile(imagePath, image.encodedWith[encoderKey].binary);
            }
            catch (err) {
                // @ts-ignore
                core.error(err);
            }
        }
        yield imagePool.close();
    });
}
exports.default = main;

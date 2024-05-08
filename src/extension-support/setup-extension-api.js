// output a Scratch Object contains APIs all extension needed
const BlockType = require('./block-type');
const ArgumentType = require('./argument-type');
const TargetType = require('./target-type');
const Cast = require('../util/cast');
const Color = require('../util/color');
const createTranslate = require('./tw-l10n');
const log = require('../util/log');

let openVM = null;
let translate = null;
let needSetup = true;
const pending = new Set();
const clearScratchAPI = id => {
    if (window.IIFEExtensionInfoList && id) {
        window.IIFEExtensionInfoList = window.IIFEExtensionInfoList.filter(ext => ext.info.extensionId !== id);
    }
    pending.delete(id);
    if (global.Scratch && pending.size === 0) {
        global.Scratch.extensions = {
            register: extensionInstance => {
                const info = extensionInstance.getInfo();
                throw new Error(`ScratchAPI: ${info.id} call extensions.register too late`);
            }
        };
        global.Scratch.vm = null;
        global.Scratch.runtime = null;
        global.Scratch.renderer = null;
        needSetup = true;
    }
};

const setupScratchAPI = (vm, id) => {
    pending.add(id);
    if (!needSetup) {
        return;
    }
    const registerExt = extensionInstance => {
        const {extensionManager} = vm;
        const info = extensionInstance.getInfo();
        const extensionId = info.id;
        if (extensionManager.isExtensionLoaded(extensionId)) {
            const message = `Rejecting attempt to load a second extension with ID ${extensionId}`;
            log.warn(message);
            return;
        }

        const serviceName = extensionManager._registerInternalExtension(extensionInstance);
        extensionManager.setLoadedExtension(extensionId, serviceName);
        extensionManager.runtime.compilerRegisterExtension(
            extensionId,
            extensionInstance
        );
        const extObj = {
            info: {
                name: info.name,
                extensionId
            },
            Extension: () => extensionInstance.constructor
        };
        window.IIFEExtensionInfoList = window.IIFEExtensionInfoList || [];
        window.IIFEExtensionInfoList.push(extObj);
        return;
    };

    if (!openVM) {
        const {runtime} = vm;
        if (runtime.ccwAPI && runtime.ccwAPI.getOpenVM) {
            openVM = runtime.ccwAPI.getOpenVM();
        } else {
            openVM = {
                runtime: vm.runtime
            };
        }
    }
    if (!translate) {
        translate = createTranslate(vm.runtime);
    }

    const scratch = {
        ArgumentType,
        BlockType,
        TargetType,
        Cast,
        Color,
        translate,
        extensions: {
            register: registerExt
        },
        vm: openVM,
        runtime: openVM.runtime,
        renderer: openVM.runtime.renderer
    };
    global.Scratch = Object.assign(global.Scratch || {}, scratch);
    needSetup = false;
};

module.exports = {setupScratchAPI, clearScratchAPI};

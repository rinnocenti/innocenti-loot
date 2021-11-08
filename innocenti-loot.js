import { registerSettings } from "./settings.js";
import { ActionLoot } from './scripts/ActionLoot.js';
import { InnLootApp } from './apps/InnLootApp.js';
import { GMActions } from './scripts/gmactions.js';
export const LOOTED = 'Looted';
export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: innocenti-loot | ", ...args);
};
export let log = (...args) => console.log("innocenti-loot | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("innocenti-loot | ", ...args);
};
export let error = (...args) => console.error("innocenti-loot | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("innocenti-loot", key);
};
export let moduleName = "innocenti-loot";
export let systemCurrency = key => {
    game[`${key}`].config.currencies;
}

export class InnocentiLoot {
    static init() {
        InnocentiLoot.SOCKET = "module.innocenti-loot";

        registerSettings();
    }
    static ready() {
        game.socket.on(InnocentiLoot.SOCKET, InnocentiLoot.onMessage);
    }
    static async onMessage(data) {
        // transi��o de registro de soket master
        console.log("Chegou AQUI");
        switch (data.action) {
            case 'sendLoot':
                if (game.user.isGM) {
                    let gmaction = new GMActions(data);
                    await gmaction.SendLoot();
                }
                break;
            case 'createLoot':
                if (game.user.isGM) {
                    let gmaction = new GMActions(data);
                    await gmaction.CreateLoot();
                }
                await console.log("EM TOOOOODOOOOS")
                break;
            default:
        }
        
    }
    static async onDeleteCombat(combat) {
        if (game.user.isGM) {
            console.log("END COMBAT", combat);
            let apploot = new InnLootApp(combat);
            await apploot.render(true);
        }
    }
}

Hooks.once('init', async function () {
    //log('Initializing Combat Details');
    InnocentiLoot.init();
});
Hooks.on("ready", InnocentiLoot.ready);
//Hooks.on("deleteCombat", InnocentiLoot.onDeleteCombat);
window.InnocentiLoot = {
    Loot: ActionLoot
}
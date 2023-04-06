import { i18n, setting, log, moduleName, LOOTED } from '../innocenti-loot.js';
import { InnLootApp } from '../apps/InnLootApp.js';
import { SumObjectsByKey } from '../scripts/MenageItems.js';
/**
 * Class to prepare target objects for loot
 * */
export class ActionLoot {
    constructor() {
        // define the structure of currencies by System
        switch (game.system.id.toLowerCase()) {
            case 'dnd5e':
                this.currencys = game.dnd5e.config.currencies;
                break;
        }
        this.currency = {}
        //Define active modules
        this.modules = {};
        this.modules['better-rolltables'] = game.modules.get("better-rolltables")?.active;
        this.modules['dfreds-pocket-change'] = game.modules.get("dfreds-pocket-change")?.active;
        this.modules['lootsheetnpc5e'] = game.modules.get("lootsheetnpc5e")?.active;
        this.minDistance = setting("interactDistance");
        // Create data struture
        this.data = {
            loot: [],
            pickpocket: [],
            rollprivate: false,
            preview: true,
            combat: false
        };
    }

    PrivateMode() {
        this.data.rollprivate = true;
    }

    NotPreview() {
        this.data.preview = false;
    }

    /**
     * Performs the first validation of targets and prepares an asynchronous structure
     * */
    async Check() {
        //Check whether the player has a selected token in his possession
        if (canvas.tokens.controlled.length === 0)
            return ui.notifications.error(i18n('Looting.Errors.noSelect'));
        this.token = canvas.tokens.controlled[0];
        if (this.token == undefined || !this.token) return;
        //Check whether the player has a target token in
        if (!game.user.targets.values().next().value)
            return ui.notifications.warn(i18n('Looting.Errors.noToken'));
        this.targets = game.user.targets;
        if (this.targets == undefined || this.targets.size <= 0) return;

        //With valid targets starts an individual token check.
        await this.CheckTargets(this.targets);

        //Check if the function returned any loot in this.data
        //TODO: I'm still not sure if I'll make a pickpocket app, but I've already prepared it for the attempt.
        if (this.data.loot.length <= 0)
            return ui.notifications.info(i18n('Looting.Errors.noloot'));

        //Exit data Debug
        if (setting('debug'))
            log('DATA ', this.data);
        //makes an attempt to loot.
        if (this.data.preview)
            await this.AttemptLoot();
        else
            await this.MakeLoot();
    }

    /**
     * Alternative version of the Check() function, to be called by the end-of-combat hook.
     * @param {any} combat - the list of combatants of the encounter
     */
    async CheckCombat(combat) {
        this.data.combat = true;
        let combatantes = combat.combatants._source;
        this.targets = combatantes.map(combatant => {
            return canvas.tokens.get(combatant.tokenId);
        });
        await this.CheckTargets(this.targets, this.data.combat);
        if (this.data.loot.length <= 0)
            return ui.notifications.info(i18n('Looting.Errors.noloot'));
        if (setting('debug'))
            log('DATA ', this.data);
        await this.AttemptLoot();
    }

    /**
     * Go through all targets to check your inventory
     * @param {Map} targets 
     * @param {boolean} isCombat
     */
    async CheckTargets(targets, isCombat = false) {
        for (let entity of targets) {
            //Check if the target is another player
            if (entity.actor.type === 'character') {
                /* here's a catch, because the function can be called by the end-of-combat hook as well as the macro. As end of combat hooks there is no previously selected token, and a list of complete npc and pc is passed as targets, so it takes the last player character on the list as the author(this.token) of the loot request.*/
                this.token = entity;
                if (!isCombat) ui.notifications.warn(i18n('Looting.Errors.playerTarget'));
                continue;
            }
            //Verify that the selected token and its targets are not the same
            if (!isCombat && entity.id == this.token.id) {
                ui.notifications.warn(i18n('Looting.Errors.thesame')); continue;
            }
            // Check if you are in the allowable distance in squere
            if (!isCombat && this.CheckDistance(this.token, entity, this.minDistance) != true) continue;

            //Check if is Alive
            let actorData = entity.actor.system;
            let action = (actorData.attributes.hp.value > 0) ? 'pickpocket' : 'loot';

            if (action == 'loot') {
                // Check if the token is still in the scene if it's already been looted
                if (entity.document.getFlag(moduleName, LOOTED)) {
                    if (!this.data.rollprivate)
                        ui.notifications.warn(game.i18n.format("Looting.Errors.invalidCheck", { token: entity.name }));
                    else
                        ui.notifications.info(i18n('Looting.Errors.noloot'));
                    continue;
                }

                //If the token has currencys, duplicate its properties
                this.currency = duplicate(actorData?.currency);
                // Filters the target's inventory with only looted items
                let items = await this.FilterInventory(entity.actor.items);
                if (items.length <= 0 && Object.values(this.currency).every(item => item <= 0)) {
                    //if (!setting('debug'))
                    //    entity.document.setFlag(moduleName, LOOTED, true);
                    ui.notifications.warn(game.i18n.format("Looting.Errors.noloot", { token: entity.name })); continue;
                }
                // TODO: Fazer adaptação para aceitar itemPiles
                //reshapes the inventory list looking for special items such as currancys-type items or table-type items.
                items = await this.ConvertLoots(items, this.currencys);
                //creates a data list with the final results for loot creation.
                this.data[`${action}`].push({
                    token: { id: entity.id, img: entity.document.texture.src }, actor: entity.actor, elevation: entity.document.elevation, items: items, currency: this.currency
                });
            }
            if (!isCombat && action == 'pickpocket') {
                //TODO: Talvez Implementar um pickpocket
                ui.notifications.warn(game.i18n.format("Looting.Errors.isalive", { token: entity.name })); continue;
            }
        }
    }

    /**
     * Processes the loot attempt, creating an app for loot selection
     * this.AttemptLoot();
     * */
    async AttemptLoot() {
        let inventary = new InnLootApp(this.token, this.data);
        inventary.render(true);
    }

    /**
     * Processes  auto looting, no preview screen
     * this.MakeLoot();
     * */
    async MakeLoot() {
        let inventary = new InnLootApp(this.token, this.data);
        inventary.LootAll();
    }

    /**
     * Check the distance of the token and the target to see if it is within the allowed range.
     * the limit distance is configured in the module settings
     * @param {any} token
     * @param {any} targetToken
     * @param {number} limitSquere
     */
    CheckDistance(token, targetToken, limitSquere) {
        let gridDistance = (limitSquere < 1) ? 1 : limitSquere;
        // minimo de distancia 1
        let distance = Math.ceil(canvas.grid.measureDistance(token, targetToken, { gridSpaces: true }));
        let nGrids = Math.floor(distance / canvas.scene.grid.distance);
        if (nGrids <= gridDistance) return true;
        ui.notifications.warn(game.i18n.format("Looting.Errors.invalidDistance", { dist: gridDistance }));
        return false;
    }

    /**
     * remove non-lootable items from inventory list
     * @param {Map} items
     */
    async FilterInventory(items) {
        return await items.filter(item => {
            if (item == null || item == undefined) return;
            if (item.type == "class" || item.type == "spell" || item.type == "feat") return;
            let itemData = item.system;
            if (item.type === "weapon" && (itemData.weaponType == "siege" || itemData.weaponType == "natural")) return;
            if (item.type === "equipment" && (itemData.equipmentType == "vehicle" || itemData.equipmentType == "natural")) return;
            return item;
        });
    }
    /**
     * search the list of inventories for special items for conversions such as currency-type item and table-type item
     * @param {any} items
     * @param {any} currencys
     */
    async ConvertLoots(items, currencys = {}) {
        // Convert tables sorts
        let nitem = new Set();
        for (var i = 0; i < items.length; i++) {
            let matches = items[i].name.match(/Table:?\s([\w\s\S]+)/is);
            if (matches == null) {
                //nitem.add(items[i]); continue;
                let currency = await this.ItemCurrency2Coins(items[i], currencys);
                if (currency == false) {
                    nitem.add(items[i]); continue;
                }
                this.currency = SumObjectsByKey(this.currency, currency)
                continue;
            }
            let table = game.tables.getName(matches[1].trim());
            let re = await table.draw({ 'rollMode': setting("showRolltable") });
            let result = re.results;

            for (let r of result) {
                let packs = game.packs.get(r.documentCollection);
                let entity = (packs) ? await packs.getDocument(r.documentId) : game.items.get(r.documentId);
                if (!entity) return ui.notifications.error(game.i18n.localize('Looting.Errors.notItem'));
                let currency = await this.ItemCurrency2Coins(entity, currencys);
                if (currency == false) {
                    nitem.add(entity); continue;
                }
                this.currency = SumObjectsByKey(this.currency, currency);
                let rolltable = r.parent;
                if (this.modules['better-rolltables'] && rolltable.flags["better-rolltables"]["table-type"] == 'loot' && rolltable.flags["better-rolltables"]["table-currency-string"] != '') {
                    let aformula = rolltable.getFlag("better-rolltables", "table-currency-string");
                    let lootCurrency = await this.LootRollTable2Coins(aformula, currencys);
                    if (!setting('debug'))
                        console.log("LOOT", lootCurrency, this.currency);
                    this.currency = SumObjectsByKey(this.currency, lootCurrency);
                }
            }
        }
        return nitem;
    }
    /**
     * Returns the currency value for the item with end text "(gp)"
     * @param {any} item - object item type
     * @param {any} currencys - array for cyrrency system
     */
    async ItemCurrency2Coins(item, currencys = {}) {
        let matches = item.name.match(/\(([^)][a-z]{1,2})\)$/);
        if (matches == null) return false;
        let currency = {};
        if (matches[1] in currencys) {
            if (!currency[`${matches[1]}`]) currency[`${matches[1]}`] = 0;
            let itemData = item.system;
            if (Roll.validate(itemData.source)) {
                let r = new Roll(itemData.source);
                let total = await r.evaluate({ async: true });
                currency[`${matches[1]}`] += total.total;
            } else {
                currency[`${matches[1]}`] += itemData.quantity;
            }
            return currency;
        }
    }

    /**
     * Returns the currency value for the item with end text "[gp]"
     * @param {string} tableCurrency - string for loot rolltable
     * @param {any} currencys - array for cyrrency system
     */
    async LootRollTable2Coins(tableCurrency, currencys = {}) {
        let allFormulas = tableCurrency.split(',');
        let currency = {};
        for (var i = 0; i < allFormulas.length; i++) {
            let matches = allFormulas[i].match(/\[([^)][a-z]{1,2})\]$/);
            if (matches == null) return false;
            if (matches[1] in currencys) {
                let roll = new Roll(allFormulas[i]);
                let totalroll = await roll.evaluate({ async: true });
                currency[`${matches[1]}`] = (currency[`${matches[1]}`]) ? totalroll.total + currency[`${matches[1]}`] : totalroll.total;
            }
        }
        return currency;

    }
}

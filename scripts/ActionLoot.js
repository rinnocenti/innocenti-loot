import { i18n, setting, log, moduleName, LOOTED } from '../innocenti-loot.js';
import { InnLootApp } from '../apps/InnLootApp.js';
import { SumObjectsByKey } from '../scripts/MenageItems.js';

export class ActionLoot {
    constructor() {
        // Defini o tipo de moedas do systema
        switch (game.system.id.toLowerCase()) {
            case 'dnd5e':
                this.currencys = game.dnd5e.config.currencies;
                break;
        }
        this.currency = {}
        //definir modulos ativos
        this.modules = {};
        this.modules['better-rolltables'] = game.modules.get("better-rolltables")?.active;
        this.modules['dfreds-pocket-change'] = game.modules.get("dfreds-pocket-change")?.active;
        this.modules['lootsheetnpc5e'] = game.modules.get("lootsheetnpc5e")?.active;
        this.data = {
            loot: [],
            pickpocket: []
        };
    }

    async CheckTargets(targets, isCombat = false) {
        for (let entity of targets) {
            //Verifica se o alvo é outro jogador
            if (entity.actor.type === 'character') {
                if (!isCombat) ui.notifications.warn(i18n('Looting.Errors.playerTarget'));
                continue;
            }
            // Verifica se o alvo é o mesmo que o ativo
            if (!isCombat && entity.id == this.token.id) {
                ui.notifications.warn(i18n('Looting.Errors.thesame')); continue;
            }
            // Verificar se esta na distancia em quadros permitido
            if (!isCombat && this.CheckDistance(entity) != true) continue;

            if (entity.document.getFlag(moduleName, LOOTED)) {
                ui.notifications.warn(game.i18n.format("Looting.Errors.invalidCheck", { token: entity.name })); continue;
            }
            this.currency = duplicate(entity.actor.data.data.currency);

            let items = await this.FilterInventory(entity.actor.items);
            if (items.length <= 0 && Object.values(this.currency)
                .every(item => item <= 0)) continue;

            let type = entity.actor.type
            if (this.modules['lootsheetnpc5e'])
                type = entity.actor.getFlag('lootsheetnpc5e', 'lootsheettype');
            let action = (entity.actor.data.data.attributes.hp.value <= 0 || type == 'loot') ? 'loot' : 'pickpocket';

            items = await this.ConvertLoots(items, this.currencys);
            this.data[`${action}`].push({
                actor: entity.actor, type: type, items: items, currency: this.currency
            });
        }
    }
    async CheckCombat(combat) {
        console.log("COMBAT", combat);
        
        let combatantes = combat.combatants._source;
        this.targets = combatantes.map(combatant => {
            return canvas.tokens.get(combatant.tokenId);
        });
        console.log("COMBATENTS", this.targets);
        await this.CheckTargets(this.targets, true);
        if (this.data.loot.length <= 0)
            return ui.notifications.info(i18n('Looting.Errors.noloot'));
        if (setting('debug'))
            log('DATA ', this.data);
        await this.AttemptLoot();
        //[{actor,currency,item,type}]
    }
    async Check() {
        if (canvas.tokens.controlled.length === 0)
            return ui.notifications.error(i18n('Looting.Errors.noSelect'));
        if (!game.user.targets.values().next().value)
            return ui.notifications.warn(i18n('Looting.Errors.noToken'));
        this.token = canvas.tokens.controlled[0];
        this.targets = game.user.targets;
        if (this.targets == undefined || this.targets.size <= 0) return;
        if (this.token == undefined || !this.token) return;
        await this.CheckTargets(this.targets);

        if (this.data.loot.length <= 0 && this.data.pickpocket.length <= 0)
            return ui.notifications.info(i18n('Looting.Errors.noloot'));

        //Exit data Debug
        if (setting('debug'))
            log('DATA ', this.data);
        await this.AttemptLoot()
    }

    async AttemptLoot() {
        let inventary = new InnLootApp(this.token, this.data);
        inventary.render(true);
    }

    ///Checa a distancia do token e do alvo para ver se esta na distancia permitida.
    CheckDistance(targetToken) {
        let minDistance = setting("interactDistance");
        let gridDistance = (minDistance < 1) ? 1 : minDistance;
        // minimo de distancia 1
        let distance = Math.ceil(canvas.grid.measureDistance(this.token, targetToken, { gridSpaces: true }));
        let nGrids = Math.floor(distance / canvas.scene.data.gridDistance);
        if (nGrids <= gridDistance) return true;
        ui.notifications.warn(game.i18n.format("Looting.Errors.invalidDistance", { dist: gridDistance }));
        return false;
    }
    // Filtra os itens não lootiaveis.
    async FilterInventory(items) {
        return await items.filter(item => {
            if (item == null || item == undefined) return;
            if (item.type == "class" || item.type == "spell" || item.type == "feat") return;
            if (item.type === "weapon" && (item.data.data.weaponType == "siege" || item.data.data.weaponType == "natural")) return;
            if (item.type === "equipment" && (item.data.data.equipmentType == "vehicle" || item.data.data.equipmentType == "natural")) return;
            return item;
        });
    }
    async ConvertLoots(items, currencys = {}) {
        // Convert tables sorts
        let nitem = new Set();
        for (var i = 0; i < items.length; i++) {
            let matches = items[i].name.match(/Table:?\s([\w\s\S]+)/is);
            if (matches == null) {
                //nitem.add(items[i]); continue;
                let currency = await this.RollLootCoins(items[i], currencys);
                if (currency == false) {
                    nitem.add(items[i]); continue;
                }
                this.currency = SumObjectsByKey(this.currency, currency)
                continue;
            }
            let table = game.tables.getName(matches[1].trim());
            let re = await table.draw();
            let result = re.results;
            for (let r of result) {
                let packs = game.packs.get(r.data.collection);
                let entity = (packs) ? await packs.getDocument(r.data.resultId) : game.items.get(r.data.resultId);
                if (!entity) return ui.notifications.error(game.i18n.localize('Looting.Errors.notItem'));
                if (this.modules['better-rolltables']) {
                    let formula = r.data.flags["better-rolltables"]["brt-result-formula"].formula;
                    let roll = new Roll(formula)
                    let total = await roll.evaluate({ async: true });
                    entity.data.data.quantity = total.total;
                }
                let currency = await this.RollLootCoins(entity, currencys);
                if (currency == false) {
                    nitem.add(entity); continue;
                }
                this.currency = SumObjectsByKey(this.currency, currency)
                continue;
            }
        }
        return nitem;
    }
    // Converte loots de moedas em moedas reais.
    async RollLootCoins(item, currencys = {}) {
        let matches = item.name.match(/\(([^)][a-z]{1,2})\)$/);
        if (matches == null) return false;
        let currency = {};
        if (matches[1] in currencys) {
            if (!currency[`${matches[1]}`]) currency[`${matches[1]}`] = 0;
            if (Roll.validate(item.data.data.source)) {
                let r = new Roll(item.data.data.source);
                let total = await r.evaluate({ async: true });
                currency[`${matches[1]}`] += total.total;
            } else {
                currency[`${matches[1]}`] += item.data.data.quantity;
            }
            return currency;
        }
    }

}
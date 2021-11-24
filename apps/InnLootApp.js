import { setting, moduleName, i18n } from '../innocenti-loot.js';
import { SumProp, unionSet, FormatCurrency, resetObject } from '../scripts/MenageItems.js';
import { GMActions } from '../scripts/gmactions.js';
export class InnLootApp extends Application {
    constructor(entity, options = {}) {
        super(options);
        let listChar = game.users.filter(chara => chara.character).map(actor => [actor.character.uuid, actor.character.name]);
        this.lootSheet5e = game.modules.get("lootsheetnpc5e")?.active
        this.giveLootOptions = Object.fromEntries(listChar);
        let sceneName = (game.scenes.active.data.navName != '') ? game.scenes.active.data.navName:game.scenes.active.data.name;
        this.lootName = sceneName + " " + i18n('Looting.MsgChat.Treasure');
        this.loots = options.loot;
        var allcurr = options.loot.map(item => item.currency);
        this.currency = SumProp(allcurr);
    }

    static get defaultOptions() {

        return mergeObject(super.defaultOptions, {
            id: "inventoryloot",
            title: game.i18n.localize("Looting.MsgChat.titleLoot"),
            template: "./modules/innocenti-loot/templates/LootInventory.html",
            width: 400,
            height: 400,
            popOut: true,
        });
    }
    async getData(options) {
        this.targets = this.loots.map(item => item.token);
        this.elevation = this.loots.map(item => item.elevation);
        let uniqueList = unionSet(this.loots.map(item => item.items));
        let invnt = new LootInventary();
        uniqueList = await invnt.DamageItems(uniqueList);
        uniqueList = await invnt.Unique(uniqueList);
        this.data = {};
        this.data.loots = uniqueList;
        this.data.currency = this.currency;
        return {
            lootName: this.lootName,
            targets: this.loots,
            giveLootOptions: this.giveLootOptions,
            giveloot: _token.actor.uuid,
            loots: this.data.loots,
            currency: this.currency,
            lootsheet: this.lootSheet5e,
        };
    }

    async ConvertItem2Money(actorCurrency) {
        let sale = 0;
        this.data.loots.map(item => {
            if (this.allChecks.includes(item.name) || (setting('convertBroken') == 2 && item.data.flags[`${moduleName}`]?.isBroken)) {
                let coingp = (item.data.data.quantity * item.data.data.price) * setting('fastGpConvert');
                item.data.flags[`${moduleName}`] = { convertGp: coingp.toFixed(2) }
                sale += coingp;
            }
        });
        // Configura o dinheiro
        let currency = duplicate(actorCurrency);
        let gpSale = FormatCurrency(sale, game.system.id);
        this.data.currency = SumProp([this.data.currency, gpSale]);
        for (let coin in this.currency) {
            currency[coin] = this.data.currency[coin] + currency[coin];
        }
        return currency;
    }
    async PrepareItens() {
        let aitems = false;
        if (setting('convertBroken') == 0) {
            aitems = this.data.loots.filter(x => !x.data.flags[`${moduleName}`]?.convertGp && !x.data.flags[`${moduleName}`]?.isBroken).map(i => i.toObject());
        } else {
            aitems = this.data.loots.filter(x => !x.data.flags[`${moduleName}`]?.convertGp).map(i => i.toObject());
        }
        if (setting('debug')) console.log("ALL LOOT", aitems);
        return aitems;
    }

    async CreateLoot() {
        if (setting('debug')) console.log("LOOOTS", this);
        this.allChecks = this.getCheckbox();
        let lootName = $('#lootName').val();
        let wallet = resetObject(duplicate(_token.actor.data.data.currency))
        let currency = await this.ConvertItem2Money(wallet);
        let aitems = await this.PrepareItens();
        let dataAction = { action: "createLoot", lootName: lootName, currency: currency, items: aitems, targets: this.targets, x: _token.x, y: _token.y, elevation: this.elevation }
        if (game.user.isGM) {
            let gmaction = new GMActions(dataAction);
            await gmaction.CreateLoot();
        } else {
            game.socket.emit(`module.${moduleName}`, dataAction);
        }

        //Change Strings Chat
        let requestdata = {
            items: this.data.loots,
            giveloot: this.lootName,
            currency: this.data.currency,
            lootfoot: i18n('Looting.MsgChat.TokenLoot')
        };
        //Chat template
        const html = await renderTemplate("./modules/innocenti-loot/templates/LootAllChat.html", requestdata);
        let chatData = {
            speaker: ChatMessage.getSpeaker(),
            content: html
        };
        ChatMessage.create(chatData, {});
        this.close();
    }
    async LootAll() {
        if (setting('debug')) console.log("LOOOTS", this.data);
        this.allChecks = this.getCheckbox();

        let giveActor = $('select[name=giveloot] option').filter(':selected').val().split('.');
        let actors = game.actors.get(giveActor[1]);
        let currency = await this.ConvertItem2Money(actors.data.data.currency);
        let aitems = await this.PrepareItens();


        if (game.user.isGM || _token.actor.id == actors.id) {
            await actors.update({ "data.currency": currency });
            await actors.createEmbeddedDocuments("Item", aitems, { noHook: true });
            if (setting('debug')) console.log("LISTA", this);
        } else {
            game.socket.emit(`module.${moduleName}`, { action: "sendLoot", actor: actors.id, currency: currency, items: aitems });
        }

        //Change Strings Chat
        let requestdata = {
            lootfoot: this.lootName,
            items: this.data.loots,
            giveloot: actors.name,
            currency: this.data.currency
        };
        //Chat template
        const html = await renderTemplate("./modules/innocenti-loot/templates/LootAllChat.html", requestdata);
        let chatData = {
            speaker: ChatMessage.getSpeaker(),
            content: html
        };
        ChatMessage.create(chatData, {});
        this.close();
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.allChecks = [];
        var that = this;

        $('#select-all').click(function (event) {
            if (this.checked) {
                // Iterate each checkbox
                $(':checkbox').each(function () {
                    this.checked = true;
                });
            } else {
                $(':checkbox').each(function () {
                    this.checked = false;
                });
            }
        });

        $('.dialog-buttons.lootall', html).click($.proxy(this.LootAll, this));
        $('.dialog-buttons.lootcreate', html).click($.proxy(this.CreateLoot, this));
    };

    getCheckbox() {
        var checkboxes = document.querySelectorAll('input[type=checkbox]:checked')
        var allchecks = [];
        for (var i = 0; i < checkboxes.length; i++) {
            allchecks.push(checkboxes[i].value)
        }
        return allchecks
    }
}

export class LootInventary {
    constructor() {
        this.itemRaritys = [game.dnd5e.config.itemRarity.common, game.dnd5e.config.itemRarity.uncommon, game.dnd5e.config.itemRarity.rare, game.dnd5e.config.itemRarity.veryRare, game.dnd5e.config.itemRarity.legendary, game.dnd5e.config.itemRarity.artifact]
    }

    async Unique(lista) {
        let checkUni = [];
        for (var i = 0; i < lista.length; i++) {
            let actual = lista[i];
            let notRepat = checkUni.find(check => check.name == actual.name);
            if (!notRepat) {
                checkUni.push(actual);
            } else {
                let quant = notRepat.data.data.quantity + lista[i].data.data.quantity;
                checkUni.map(check => {
                    if (check.name == actual.name)
                        check.data.data.quantity = quant;
                });
            }
        }
        return checkUni;
    }

    async DamageItems(lista) {
        let checkUni = [];
        let damageItem = { weapon: setting("perWeapons"), equipment: setting("perEquipment"), consumable: setting("perConsumable"), loot: 0 }
        let lootEquipeed = setting('lootEquipable');
        let agio = setting('lootEquipableAgil');
        let isDamageble = (item) => {
            if (item.data.data.properties?.mgc == true) return false;
            if (this.itemRaritys.indexOf(item.data.data.rarity) > setting('rarityBroken')) return false;
            if (damageItem[`${item.type}`] <= 0) return false;
            if (item.getFlag(moduleName, 'isBroken') == true) return false;
            return true;
        };

        lista.forEach(item => {
            let damages = 0;
            let brokens = 0;
            let quant = item.data.data.quantity;
            if (setting('debug')) item.unsetFlag(moduleName, 'isBroken');
            if (isDamageble(item)) {
                //if (setting('debug')) console.log("pode sofrer damage", item.name)
                if (!item.data.data.equipped || (item.data.data.equipped && lootEquipeed)) {
                    let chance = (item.data.data.equipped && lootEquipeed) ? agio + damageItem[`${item.type}`] : damageItem[`${item.type}`];
                    for (var i = 0; i < quant; i++) {
                        let ranChance = Math.floor(Math.random() * 100) + 1;
                        let isDamaged = false;
                        if (item.type == 'weapon' || item.type == 'equipment') {
                            isDamaged = ((chance - ranChance) > 0 && (chance - ranChance) <= setting('lootDamage'));
                            if (isDamaged) {
                                damages++;
                                let price = item.data.data.price * setting('damageReducePrice');
                                price = Math.round((price + Number.EPSILON) * 100) / 100;
                                let rDamage = item.data.data?.damage?.parts;
                                let nDamage = [];
                                if (rDamage.length > 0) {
                                    for (var i = 0; i < rDamage.length; i++) {
                                        nDamage.push(["ceil((" + rDamage[i][0] + ")/2)", rDamage[i][1]])
                                    }
                                }

                                let nitem = item.clone({ name: item.name + ` (${i18n('Looting.MsgChat.Damage')})`, 'data.price': price, 'data.quantity': 1, 'data.equipped': false, 'data.damage.parts': nDamage }, { keepId: true });
                                checkUni.push(nitem);
                            }
                        }
                        let isBroken = (ranChance <= chance && !isDamaged);
                        if (isBroken) {
                            brokens++;
                            let price = item.data.data.price * setting('brokenReducePrice');
                            price = Math.round((price + Number.EPSILON) * 100) / 100;
                            let itemType = (setting('convertBroken') != 2) ? item.type : 'loot';
                            let nitem = item.clone({ name: item.name + ` (${i18n('Looting.MsgChat.Broken')})`, 'data.price': price, 'data.quantity': 1, 'data.equipped': false, 'flags.innocenti-loot.isBroken': true, type: itemType }, { keepId: true });
                            checkUni.push(nitem);
                        }
                    }
                }
            }
            let removes = brokens + damages;
            quant = quant - removes;
            if (quant > 0) {
                let nitem = item.clone({ 'data.quantity': quant, 'data.equipped': false }, { keepId: true });
                checkUni.push(nitem);
            }
        });
        return checkUni;
    }
}
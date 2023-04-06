import { setting, moduleName, i18n } from '../innocenti-loot.js';
import { SumProp, unionSet, BaseGPFormat, ConvertCurrancy, resetObject, ModelCurrencys } from '../scripts/MenageItems.js';
import { GMActions } from '../scripts/gmactions.js';
export class InnLootApp extends Application {
    constructor(entity, options = {}) {
        super(options);
        let listChar = game.users.filter(chara => chara.character).map(actor => [actor.character.uuid, actor.character.name]);
        this.lootSheet5e = game.modules.get("lootsheetnpc5e")?.active;
        this.giveLootOptions = Object.fromEntries(listChar);
        let sceneName = (game.scenes.active.navName != '') ? game.scenes.active.navName : game.scenes.active.name;
        this.lootName = sceneName + " " + i18n('Looting.MsgChat.Treasure');
        this.loots = options.loot;
        var allcurr = options.loot.map(item => item.currency);
        this.currency = SumProp(allcurr);
        this.rollprivate = options.rollprivate;
        this.preview = options.preview;
        this.combat = options.combat;
        this.createLoot = (game.modules.get("lootsheetnpc5e")?.active || game.modules.get("dfreds-pocket-change")?.active)? true:false
        this.currencys = ModelCurrencys(game.system.id);
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
        await this.defaultGetData();
        return {
            lootName: this.lootName,
            targets: this.loots,
            giveLootOptions: this.giveLootOptions,
            giveloot: _token.actor.uuid,
            loots: this.data.loots,
            currency: this.currency,
            lootsheet: this.lootSheet5e,
            currencys: ModelCurrencys(game.system.id),
            rollprivate: this.rollprivate,
            combat: this.combat,
            createLoot: this.createLoot
        };
    }

    async defaultGetData() {
        this.targets = this.loots.map(item => item.token);
        this.elevation = this.loots.map(item => item.elevation);
        let uniqueList = unionSet(this.loots.map(item => item.items));
        let invnt = new LootInventary();
        uniqueList = await invnt.DamageItems(uniqueList);
        uniqueList = await invnt.Unique(uniqueList);
        this.data = {};
        this.data.loots = uniqueList;
        this.data.currency = this.currency;
    }

    async ConvertItem2Money(actorCurrency) {
        let sale = 0;
        let denomination = 'gp';
        this.data.loots.map(item => {
            if (this.allChecks.includes(item.name) || (setting('convertBroken') == 2 && item.flags[`${moduleName}`]?.isBroken)) {
                let itemData = item.system;
                let coingp = (itemData.quantity * itemData.price.value) * setting('fastGpConvert');
                // Correção com o novo sistema de dominação de dnd
                item.flags[`${moduleName}`] = { convertGp: coingp.toFixed(2), denomination: itemData.price.denomination}
                sale += coingp;
                denomination = itemData.price.denomination;
            }
        });
        // Configura o dinheiro
        let currency = duplicate(actorCurrency);
        let gpSale = BaseGPFormat(sale, denomination, game.system.id);
        this.data.currency = SumProp([this.data.currency, gpSale]);
        for (let coin in this.currency) {
            currency[coin] = this.data.currency[coin] + currency[coin];
        }
        return currency;
    }
    async PrepareItens() {
        let aitems = false;
        if (setting('convertBroken') == 0) {
            aitems = this.data.loots.filter(x => !x.flags[`${moduleName}`]?.convertGp && !x.flags[`${moduleName}`]?.isBroken).map(i => i.toObject());
        } else {
            aitems = this.data.loots.filter(x => !x.flags[`${moduleName}`]?.convertGp).map(i => i.toObject());
        }
        if (setting('debug')) console.log("ALL LOOT", aitems);
        return aitems;
    }

    async CreateLoot() {
        if (setting('debug')) console.log("LOOOTS", this);
        this.allChecks = this.getCheckbox();
        let lootName = $('#lootName').val();
        let tData = _token.actor.system.currency;
        let wallet = resetObject(duplicate(tData))
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
        if (this.rollprivate) {
            let whispers = game.users.filter(u => u.isGM == true || u._id == game.user.id).map(x => x._id);
            chatData['whisper'] = whispers;
        }
        this.close();
    }
    async LootAll() {
        if (setting('debug')) console.log("LOOOTS", this.data);
        let actors = _token.actor;
        this.allChecks = (this.preview) ? this.getCheckbox() : [];
        if (this.preview) {
            let getActor = $('select[name=giveloot] option').filter(':selected').val().split('.');
            actors = game.actors.get(getActor[1]);
        } else {
            await this.defaultGetData();
        }
        let actorData = actors.system;
        let currency = await this.ConvertItem2Money(actorData.currency);
        let aitems = await this.PrepareItens();

        if (game.user.isGM || _token.actor.id == actors.id) {
            await actors.update({ "system.currency": currency });
            await actors.createEmbeddedDocuments("Item", aitems, { noHook: true });
            if (game.user.isGM && !setting('debug')) {
                let gmaction = new GMActions({ action: "flagTarget", targets: this.targets });
                await gmaction.FlagTargets();
            } else {
                game.socket.emit(`module.${moduleName}`, { action: "flagTarget", targets: this.targets });
            }
            if (setting('debug')) console.log("LISTA", this);
        } else {
            game.socket.emit(`module.${moduleName}`, { action: "sendLoot", actor: actors.id, currency: currency, items: aitems, targets: this.targets });
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
        if (this.rollprivate) {
            let whispers = game.users.filter(u => u.isGM == true || u._id == game.user.id).map(x => x._id);
            chatData['whisper'] = whispers;
        }
        ChatMessage.create(chatData, {});

        if (this.preview) this.close();

    }

    activateListeners(html) {
        super.activateListeners(html);
        this.allChecks = [];
        var that = this;

        $('#select-all').click(function (event) {
            if (this.checked) {
                // Iterate each checkbox
                $('.innocenti-loot :checkbox').each(function () {
                    this.checked = true;
                });
            } else {
                $('.innocenti-loot :checkbox').each(function () {
                    this.checked = false;
                });
            }
        });

        $('input[name=changegp]:checkbox').click(function (event) {

            let clickid = $(this).attr('id');
            let lootList = that.data.loots;
            let priceHtml = $('h4.itemloot-price').text();
            let item = lootList.find(x => x._id == clickid);
            let nprice = ConvertCurrancy(item.system.price.value, item.system.price.denomination, game.system.id)
            console.log("Cicou", item, priceHtml, nprice);
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
                let norepData = notRepat.system.quantity;
                let listData = lista[i].system.quantity;
                let quant = norepData + listData;
                checkUni.map(check => {
                    if (check.name == actual.name) {
                        let chekData = check.system.quantity;
                    }
                    chekData = quant;

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
            let itemData = item.system;
            if (itemData.properties?.mgc == true) return false;
            if (this.itemRaritys.indexOf(itemData.rarity) > setting('rarityBroken')) return false;
            if (damageItem[`${item.type}`] <= 0) return false;
            if (item.getFlag(moduleName, 'isBroken') == true) return false;
            return true;
        };

        lista.forEach(item => {
            let damages = 0;
            let brokens = 0;
            let itemData = item.system;
            let quant = itemData.quantity;
            if (setting('debug')) item.unsetFlag(moduleName, 'isBroken');
            if (isDamageble(item)) {
                //if (setting('debug')) console.log("pode sofrer damage", item.name)
                if (!itemData.equipped || (itemData.equipped && lootEquipeed)) {
                    let chance = (itemData.equipped && lootEquipeed) ? agio + damageItem[`${item.type}`] : damageItem[`${item.type}`];
                    for (var i = 0; i < quant; i++) {
                        let ranChance = Math.floor(Math.random() * 100) + 1;
                        let isDamaged = false;
                        if (item.type == 'weapon' || item.type == 'equipment') {
                            isDamaged = ((chance - ranChance) > 0 && (chance - ranChance) <= setting('lootDamage'));
                            if (isDamaged) {
                                damages++;
                                let price = itemData.price.value * setting('damageReducePrice');
                                price = Math.floor((price + Number.EPSILON) * 100) / 100;
                                let rDamage = itemData?.damage?.parts;
                                let nDamage = [];
                                if (rDamage.length > 0) {
                                    for (var i = 0; i < rDamage.length; i++) {
                                        nDamage.push(["ceil((" + rDamage[i][0] + ")/2)", rDamage[i][1]])
                                    }
                                }
                                let nitem = undefined;
                                nitem = item.clone({ name: item.name + ` (${i18n('Looting.MsgChat.Damage')})`, 'system.price.value': price, 'system.quantity': 1, 'system.equipped': false, 'system.damage.parts': nDamage }, { keepId: true });
                                checkUni.push(nitem);
                            }
                        }
                        let isBroken = (ranChance <= chance && !isDamaged);
                        if (isBroken) {
                            brokens++;
                            let price = itemData.price.value * setting('brokenReducePrice');
                            price = Math.floor((price + Number.EPSILON) * 100) / 100;
                            let itemType = (setting('convertBroken') != 2) ? item.type : 'loot';
                            let nitem = undefined;
                            nitem = item.clone({ name: item.name + ` (${i18n('Looting.MsgChat.Broken')})`, 'system.price.value': price, 'system.quantity': 1, 'system.equipped': false, 'flags.innocenti-loot.isBroken': true, type: itemType }, { keepId: true });
                            checkUni.push(nitem);
                        }
                    }
                }
            }
            let removes = brokens + damages;
            quant = quant - removes;
            let nitem = undefined;
            if (quant > 0) {
                nitem = item.clone({ 'system.quantity': quant, 'system.equipped': false }, { keepId: true });
                checkUni.push(nitem);
            }
        });
        console.log("DAMEGED ITEMS", checkUni);
        return checkUni;
    }
}
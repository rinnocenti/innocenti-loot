import { moduleName } from './innocenti-loot.js';
export const registerSettings = function () {
    const MODULE_NAME = moduleName;
    let rarityItem = game.dnd5e.config.itemRarity;
    const rarityLevel = { 0: `${rarityItem.common}`, 1: `${rarityItem.uncommon}`, 2: `${rarityItem.rare}`, 3: `${rarityItem.veryRare}`, 4: `${rarityItem.legendary}`, 5: `${rarityItem.artifact}` };
    const convertTypes = {
        0: game.i18n.localize('Looting.Settings.brokenType.0'),
        1: game.i18n.localize('Looting.Settings.brokenType.1'),
        2: game.i18n.localize('Looting.Settings.brokenType.2')
    }
    const rolltableTypes = {
        'publicroll': game.i18n.localize('Looting.Settings.rolltableTypes.publicroll'),
        'gmroll': game.i18n.localize('Looting.Settings.rolltableTypes.gmroll'),
        'blindroll': game.i18n.localize('Looting.Settings.rolltableTypes.blindroll'),
        'selfroll': game.i18n.localize('Looting.Settings.rolltableTypes.selfroll')
    }
    const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 100);
    game.settings.register(MODULE_NAME, "interactDistance", {
        name: game.i18n.localize('Looting.Settings.interactDistance'),
        hint: game.i18n.localize('Looting.Settings.interactDistanceHint'),
        scope: "world",
        config: true,
        default: 1,
        type: Number
    });
    game.settings.register(MODULE_NAME, "combatLoot", {
        name: game.i18n.localize('Looting.Settings.combatLoot'),
        hint: game.i18n.localize('Looting.Settings.combatLootHint'),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register(MODULE_NAME, "imageLoot", {
        name: game.i18n.localize('Looting.Settings.imageLoot'),
        hint: game.i18n.localize('Looting.Settings.imageLootHint'),
        scope: "world",
        config: true,
        default: "icons/svg/chest.svg",
        type: String
    });
    game.settings.register(MODULE_NAME, "showRolltable", {
        name: game.i18n.localize('Looting.Settings.showRolltable'),
        hint: game.i18n.localize('Looting.Settings.showRolltableHint'),
        scope: "world",
        config: true,
        choices: rolltableTypes,
        default: "0",
        onChange: value => console.log(value),
        type: String
    });
    game.settings.register(MODULE_NAME, "lootDamage", {
        name: game.i18n.localize('Looting.Settings.lootDamage'),
        hint: game.i18n.localize('Looting.Settings.lootDamageHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 100,
            step: 1,
        },
        default: "10",
        type: Number
    });
    game.settings.register(MODULE_NAME, "damageReducePrice", {
        name: game.i18n.localize('Looting.Settings.damageReducePrice'),
        hint: game.i18n.localize('Looting.Settings.damageReducePriceHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default: "0.5",
        type: Number
    });
    game.settings.register(MODULE_NAME, "brokenReducePrice", {
        name: game.i18n.localize('Looting.Settings.brokenReducePrice'),
        hint: game.i18n.localize('Looting.Settings.brokenReducePriceHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default: "0.1",
        type: Number
    });
    game.settings.register(MODULE_NAME, "convertBroken", {
        name: game.i18n.localize('Looting.Settings.convertBroken'),
        hint: game.i18n.localize('Looting.Settings.convertBrokenHint'),
        scope: "world",
        config: true,
        choices: convertTypes,
        default: "0",
        onChange: value => console.log(value),
        type: Number
    });
    game.settings.register(MODULE_NAME, "rarityBroken", {
        name: game.i18n.localize('Looting.Settings.rarityBroken'),
        hint: game.i18n.localize('Looting.Settings.rarityBrokenHint'),
        scope: "world",
        config: true,
        choices: rarityLevel,
        default: "0",
        onChange: value => console.log(value),
        type: Number
    });

    game.settings.register(MODULE_NAME, "perWeapons", {
        name: game.i18n.localize('Looting.Settings.percentWeapon'),
        hint: game.i18n.localize('Looting.Settings.percentWeaponHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 100,
            step: 1,
        },
        default: "30",
        type: Number
    });
    game.settings.register(MODULE_NAME, "perEquipment", {
        name: game.i18n.localize('Looting.Settings.percentEquipment'),
        hint: game.i18n.localize('Looting.Settings.percentEquipmentHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 100,
            step: 1,
        },
        default: "60",
        type: Number
    });
    game.settings.register(MODULE_NAME, "perConsumable", {
        name: game.i18n.localize('Looting.Settings.percentConsumable'),
        hint: game.i18n.localize('Looting.Settings.percentConsumableHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 100,
            step: 1,
        },
        default: "20",
        type: Number
    });

    game.settings.register(MODULE_NAME, "lootEquipable", {
        name: game.i18n.localize('Looting.Settings.lootEquipable'),
        hint: game.i18n.localize('Looting.Settings.lootEquipableHint'),
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    game.settings.register(MODULE_NAME, "lootEquipableAgil", {
        name: game.i18n.localize('Looting.Settings.lootEquipableAgil'),
        hint: game.i18n.localize('Looting.Settings.lootEquipableAgilHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 10,
            step: 1,
        },
        default: "5",
        type: Number
    });
    game.settings.register(MODULE_NAME, "fastGpConvert", {
        name: game.i18n.localize('Looting.Settings.fastGpConvert'),
        hint: game.i18n.localize('Looting.Settings.fastGpConvertHint'),
        scope: "world",
        config: true,
        range: {
            min: 0,
            max: 1,
            step: 0.05,
        },
        default: "0.25",
        type: Number
    });

    game.settings.register(MODULE_NAME, "debug", {
        name: "debug",//game.i18n.localize('Looting.Settings.interactDistance'),
        hint: "active debug",//game.i18n.localize('Looting.Settings.interactDistanceHint'),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    })
}
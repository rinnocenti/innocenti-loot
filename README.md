# Innocenti Looting

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D02SYZA)

**THIS VERSION IS A NEW SCRIPT FOR OLD INNOCENTI LOOTING**
https://raw.githubusercontent.com/rinnocenti/innocenti-looting

A module to use for looting and pick pocket tokens.
With it the token's targets will have their items looting to the user's sheet.
(with the exception of some like natural weapons, feats and spells).
Some items have a chance of not being in good use and will not be sent to the sheet (configurable percentage and types).

youtube Video:
<a href="https://www.youtube.com/embed/v6JPQ9MWi4U">Youtube - Innocenti Looting</a>

## Installation
You can install this module by using the following manifest URL : `https://raw.githubusercontent.com/rinnocenti/innocenti-looting/master/module.json`

## Dependencies
This module was created to work in a world with other support modules so you don't have to increase your workload.

The module is system dependent:
  * System Dnd5 (v. 1.0 or greater) - Maybe work in another system.. (need tests)

Modules compactiveis:
* Loot Sheet npc5e (by ChalkOne) for to differentiate combat npcs, chests and merchants: https://raw.githubusercontent.com/jopeek/fvtt-loot-sheet-npc-5e/master/module.json

Create a macro with permission for all your players with the following content:

Macro [NEW MACRO] - LOOTING

`(async () => {
let actions = new InnocentiLoot.Loot();
await actions.Check();
})();`

## How to Use
the module basically works looking for a items in the token inventory of npc with hp 0, can be looted using the target with a macro, unless they are:
classes, spells, feats, natural weapons, siege weapons, vehicle equipment and natural equipment.

### Loot Currency end Coins
From version 0.2 the module adapts a new type of loot for currencys.

a loot type item that has the end of its name, in brackets, the abbreviation of the currencies in force will be considered coins of the same type. for example:

* "Silver (sp)" will convert your quantity into silver coins.
* "Golden (gp)" will convert your quantity into golden coins.
* "Bubble (sp)" will convert your quantity into silver coins.

A valid abbreviation must be in lower case and in parentheses at the end of the item name.
Alternatively you can make the item also generate a random quantity (eg. 3d6) of the item using the item's "source" field.

For the quantity, the module will initially consider if the item's source field has a valid roll, otherwise it will consider the item's quantity field.

<img src="https://github.com/rinnocenti/innocenti-looting/blob/main/img/item-coin.png" width="70%" height="70%">
In the example above this item will generate 3d6 gold coins for the player who loot it.

### Loot Items Rolltables.
From version 0.2 the module adapts a new type of loot for random items.
This type of item does not consider the module settings for the percentages of looting items, all items drawn will be added.
a random table loot is recognized by the name that must begin with 'Table:' followed by the name of the rollable table to be drawn, eg:

'Table: My Random Tresures'

will draw new items from the "My Random Tresures" rollable table add them to the loot list.

The table should only contain items and/or other item tables.
Items can be in the items folder in your world or in any item compendium.


## Module Settings
Items also have a percentage (configurable in module settings) chance of not being in good use and not being moved (and deleted) to the character sheet.

## Future Features
* Support for Module Better Tables
* Pickpocket in lives npcs

## Support
If you like this module and would like to help or found a bug or request new features call me on discord @Innocenti#1455 or create a issue here.

## License
This Foundry VTT module, writen by Innocenti, is licensed under a Creative Commons Attribution 4.0 International License.

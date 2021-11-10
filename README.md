# Innocenti's Loot

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D02SYZA)

**THIS VERSION IS A NEW SCRIPT FOR OLD INNOCENTI LOOTING**
https://raw.githubusercontent.com/rinnocenti/innocenti-looting

*This module is being tested, and I would love to hear feedbacks from everyone who can use it.*

A module to use for looting dead tokens.
With it the token's targets or at the end of combat will have their items looting to the user's sheet or a new loot token.
(with the exception of some like natural weapons, feats and spells).
Some items have a chance of not being in good use and will not be sent to the sheet (configurable percentage and types) some even being damaged for sale and use.

youtube Video:
<s><a href="https://www.youtube.com/embed/v6JPQ9MWi4U">Youtube - Innocenti Looting</a></s>

## Installation
You can install this module by using the following manifest URL : `https://raw.githubusercontent.com/rinnocenti/innocenti-loot/master/module.json`

## Dependencies
This module was created to work in a world with other support modules so you don't have to increase your workload.

The module is system dependent:
  * System Dnd5 (v. 1.3 or greater) - Maybe work in another system.. (need tests)

Modules is compatible with (and recomended):
* Loot Sheet npc5e https://github.com/jopeek/fvtt-loot-sheet-npc-5e
* DFreds Pocket Change https://github.com/DFreds/dfreds-pocket-change
* Better roll tables https://github.com/ultrakorne/better-rolltables

# How to Use
the module basically works looking for a items in the token inventory of npc with hp 0, can be looted using the target with a macro (legacy) or in the end of combat, remove itens like classes, spells, feats, natural weapons, siege weapons, vehicle equipment and natural equipment.
This module works in two ways:

## Legacy: 
- it is possible to use it using the same macro as the previous module and in the same way, enabling a macro (example in compendium)
Create a macro with permission for all your players with the following content:

Macro [NEW MACRO] - LOOTING

`(async () => {
let actions = new InnocentiLoot.Loot();
await actions.Check();
})();`

target the tokens you want to loot and trigger the macro.

## End Combat:

At the end of the combat, the GM will have the inventory of items from the all defeated tokens and it's up to him to check and decide how it will be distributed. (NO NEED MACROS).


### Loot Currency end Coins

For this new version the itens coins e itens tables continue to work, but with the addition of also using the coins created by the DFreds Pocket Change module as well.


A loot type item that has the end of its name, in brackets, the abbreviation of the currencies in force will be considered coins of the same type. for example:

* "Silver (sp)" will convert your quantity into silver coins.
* "Golden (gp)" will convert your quantity into golden coins.
* "Bubble (sp)" will convert your quantity into silver coins.

A valid abbreviation must be in lower case and in parentheses at the end of the item name.
Alternatively you can make the item also generate a random quantity (eg. 3d6) of the item using the item's "source" field.

For the quantity, the module will initially consider if the item's source field has a valid roll, otherwise it will consider the item's quantity field.

<img src="https://github.com/rinnocenti/innocenti-looting/blob/main/img/item-coin.png" width="70%" height="70%">
In the example above this item will generate 3d6 gold coins for the player who loot it.

### Loot Items Rolltables.

The module adapts a new type of loot for random items.
a random table loot is recognized by the name that must begin with 'Table:' followed by the name of the rollable table to be drawn, eg:

'Table: My Random Tresures'

will draw new items from the "My Random Tresures" rollable table add them to the loot list.

The table should only contain items and/or other item tables.
Items can be in the items folder in your world or in any item compendium.

### Damaged and Broken Items

The module has a system of broken and damaged items. There is a percentage chance that an item will be looted, broken or damaged. (percentages and odds are checked in the module settings)
some types of items cannot be broken or damaged, they are:

* loot items
* items with property "is magic"
* whose rarity is greater than that chosen in the module's settings.
* the percentages to be set to 0%.

#### Damaged Items

Damaged items have their price and attack strength reduced according to the module's settings.

#### Broken Items
A broken item items have their price reduced according to the module's settings.
and have an exclusive setting to handle these items in the module's settings, which are:

* Ignore => The item appears in the inventory list, but is not sent to the player or loot token.
* Auto Sell => The item appears in the inventory list but is automatically converted to currencies.
* Convert to Loot => the item loses its type and is sent to the token as a simple loot item.

## Inventory Screen

When activating the macro or at the end of each combat, an inventory screen like this one will be displayed

<img src="https://github.com/rinnocenti/innocenti-loot/blob/master/img/inventory.jpg">

### 1 - Send loot for a specific player

It is now possible to send *all* the loots collected to a specific character. The character must be previously linked to a player.
this option is only relevant if used with the loot all button.

### 2 - Loot Name

This option is only relevant if used with the create loot button. It defines the name of the actor/token that will be created to place looted items.

### 3 - Targets

Displays a list of tokens that have been selected and have valid loot.

### 4 - Currencys

Details the total amount of coins found with the targets.

### 5 - Sell All items

Select all inventory items to be converted to currencies.

### 6 - Valor por unidade

Exibe o valor unitário do item.

### 7 - Sell item

Select only this inventory item to be converted to currencies.

### 8 - Loot All

By selecting the option, all eligible loot items will be sent to the selected character in "send loot to".
A chat card will be created to display the final results.

### 9 - Create Loot
This option is only available if the "Loot Sheet npc5e" module is active.
An actor with all eligible loot items will be created in the foundry's actors tab and a token will be made available on the map.
bellow the token that activated the loot macro, or on the place of the looted tokens after combat.
A chat card will be created to display the final results.

### Chat Card of Results:
<img src="https://github.com/rinnocenti/innocenti-loot/blob/master/img/chatcard.jpg">


## Future Features
* Improvement in the inventory screen
* Pickpocket in lives npcs (maybe not)

## Support
If you like this module and would like to help or found a bug or request new features call me on discord @Innocenti#1455 or create a issue here.
if you want this module to have support for other systems, please contact me explaining how it should work with the system.

## License
This Foundry VTT module, writen by Innocenti, is licensed under a Creative Commons Attribution 4.0 International License.

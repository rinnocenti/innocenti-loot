#v 0.2.43
V9 and v10 primary support

#v 0.2.42

*fix for checkbox error in check all boxs
#v 0.2.41

* fix for new lootSheet5e

#v 0.2.4
Fix currency names.
Fix token actor on create loot.
fix round down on breaked and damaged items.
Compatibility from Foundry 8.8+ and v9 

#v 0.2.33
* fixed elevation for loots

#v 0.2.32
* fixed more than one player looting at the same time

#v 0.2.31

* code cleaning
* API for lootsheet for convert items-coins and items-table to currency: 

`/* Convert all table itens and currency itens, inclusive rolltable ones */
let loot = new InnocentiLoot.Loot()
loot.ConvertLoots(ArrayItems, ArraySystemCurrency)`

`/* Convert only one item-coins to currencys. */
let loot = new InnocentiLoot.Loot()
loot.ConvertLoots(ObjItem, ArraySystemCurrency)`

#v 0.2.3
* Fiz for name treasures.
* Fix for image tokens targets

#v 0.2.2
Update compatibility with permissions

#v 0.2.1
* Finalization of Combat loots.
* Compatibility with Levels.

#v.0.1.2

Initial release.
the module has been refactored and reformatted to a new version, with better compatibility and more loot options.
A new Installation is recommended

* Players can use loot themselves or for others player via macros.
* GM can handle loot right after a fight.
* GM and Players can create a single token with all the loot found, to share with all players (via Loot Sheet npc5e module)
* Create loot with coins using special items or the "DFreds Pocket Change" module
* Sort loot with coins and items using special items (better roll table compatible)

the module is under testing, errors and bugs are expected as well as feedback from everyone who uses it.
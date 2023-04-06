import { setting, moduleName, LOOTED } from '../innocenti-loot.js';
export class GMActions {
    constructor(data = {}) {
        this.data = data;
        if (data.targetid)
            this.targetToken = canvas.tokens.get(data.targetid);
        if (data.tokenid) {
            this.token = canvas.tokens.get(data.tokenid);
            this.actor = game.actors.contents.find(a => a.id === this.token.actor.id);
        }
        if (data.targets) {
            this.targets = data.targets;
        }
    }

    async SendLoot() {
        if (setting('debug')) console.log("DATA", this.data)
        await this.FlagTargets()
        let actor = game.actors.get(this.data.actor);
        await actor.update({ "system.currency": this.data.currency });
        await actor.createEmbeddedDocuments("Item", this.data.items, { noHook: true });
    }

    async CreateLoot() {
        if (setting('debug')) console.log("Create - DATA", this.data);
        await this.FlagTargets();
        let actors = await Actor.create({
            name: this.data.lootName,
            type: "npc",
            img: setting('imageLoot'),
            'flags.core.sheetClass': 'dnd5e.LootSheetNPC5e',
            'flags.lootsheetnpc5e.lootsheettype': 'Loot'
        });
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let permissions = {};
        Object.assign(permissions, actors._source.permission);
        lootingUsers.forEach(user => {
            permissions[user._id] = CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
        });
        await actors.update({ "system.currency": this.data.currency, permission: permissions });
        await actors.createEmbeddedDocuments("Item", this.data.items, { noHook: true });
        canvas.scene.createEmbeddedDocuments("Token", [{ name: this.data.lootName, img: setting('imageLoot'), actor: actors, actorId: actors.id, x: this.data.x, y: this.data.y, elevation: Math.round(this.data.elevation) }]);
        if (!setting('debug')) canvas.tokens.deleteMany(this.data.targets);

        if (setting('debug')) console.log("Fim da chamada", this.data);
    }

    async FlagTargets() {
        for (var i = 0; i < this.targets.length; i++) {
            let target = canvas.tokens.get(this.targets[i].id);
            target.document.setFlag(moduleName, LOOTED, true);
        }
    }
}
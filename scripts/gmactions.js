import { moduleName } from '../innocenti-loot.js';
export class GMActions {
    constructor(data = {}) {
        this.data = data;
        if (data.targetid)
            this.targetToken = canvas.tokens.get(data.targetid);
        if (data.tokenid) {
            this.token = canvas.tokens.get(data.tokenid);
            this.actor = game.actors.contents.find(a => a.id === this.token.actor.id);
        }
    }

    async SendLoot() {
        console.log("DATA", this.data)
        let actor = game.actors.get(this.data.actor);
        await actor.update({ "data.currency": this.data.currency });
        await actor.createEmbeddedDocuments("Item", this.data.items, { noHook: true });
    }

    async CreateLoot() {
        console.log("Create - DATA", this.data)
        let actors = await Actor.create({
            name: this.data.lootName,
            type: "npc",
            img: "icons/svg/chest.svg",
            'flags.core.sheetClass': 'dnd5e.LootSheet5eNPC',
            'flags.lootsheetnpc5e.lootsheettype': 'Loot'
        });
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let permissions = {};
        Object.assign(permissions, actors.data.permission);
        lootingUsers.forEach(user => {
            permissions[user.id] = CONST.ENTITY_PERMISSIONS.OBSERVER;
        });
        await actors.update({ "data.currency": this.data.currency, permission: permissions });
        await actors.createEmbeddedDocuments("Item", this.data.items, { noHook: true });

        let ntoken = canvas.scene.createEmbeddedDocuments("Token", [{ name: this.data.lootName, img: "icons/svg/chest.svg", actorId: actors._id, x: this.data.x, y: this.data.y }]);

        console.log("Fim da chamada", this.data);
    }
}
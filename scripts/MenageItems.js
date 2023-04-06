export let SumProp = (arr) => {
    return arr.reduce((acc, n) => {
        for (var prop in n) {
            if (acc.hasOwnProperty(prop)) acc[prop] += n[prop];
            else acc[prop] = n[prop];
        }
        return acc;
    }, {})
}

export let SumObjectsByKey = (...objs) => {
    return objs.reduce((a, b) => {
        for (let k in b) {
            if (b.hasOwnProperty(k))
                a[k] = (a[k] || 0) + b[k];
        }
        return a;
    }, {});
}

export let unionSet = (sets) => {
    return sets.reduce((combined, list) => {
        return new Set([...combined, ...list]);
    }, new Set());
}

export let ConvertCurrancy = (gpPrice, denomination='gp', system = 'dnd5e') => {

    if (system == 'dnd5e') {
        if (denomination == 'gp') return gpPrice;
        if (denomination == 'cp') return gpPrice*100;
        if (denomination == 'sp') return gpPrice*10;
        if (denomination == 'ep') return gpPrice*2;
        if (denomination == 'pp') return gpPrice/10;
    }

}

export let BaseGPFormat = (price, baseDenomination = 'gp', system = 'dnd5e') => {
    if (system == 'dnd5e') {
        price = (baseDenomination == 'cp') ? price / 100 :
            (baseDenomination == 'sp') ? price / 10 :
                (baseDenomination == 'ep') ? price / 2 :
                    (baseDenomination == 'pp') ? price * 10 :
                        price;
        let pp = 0;
        if (price >= 1000) {
            pp = (price - (price % 1000)) / 10;
            price = price % 1000;
        }
        let nprice = price * 100
        let cp = Math.floor(((nprice % 100) % 10));
        let sp = Math.floor((nprice % 100) / 10);
        let gp = Math.floor(price);
        
        return { cp: cp, sp: sp, gp: gp, ep: 0, pp: pp }
    }
}
export let ModelCurrencys = (system) => {
    if (system == 'dnd5e') {
        return game.dnd5e.config.currencies
    }
}

export let resetObject = function (spy) {
    Object.keys(spy).forEach(function (key) { spy[key] = 0 });
    return spy;
}

export let foundryVersion = function () {
    return parseFloat(game.version);
}
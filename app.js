import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_goerli');
const contracts = {
    odex: '0x4ADf8fcE21302611aBBE3C43E6A2c5B46f8345A4',
    odexFactory: '0x06735E0951D84C4C4d4258aBF5B5aa281Bb96812',
    wbtc: '0xCd14Cd33C7Cb5ECBC9C0390f561B0110983F3A49',
    weth: '0x2ca583bF70155ec792D07D5F4D1AaFc522AD5e70',
    usd: '0x85B5eea334737318b902bDeF434E63ec5efBc113',
    odexToken: '0x553C033863B755E97FF96Ec1b633a89f8F26dBfA',
    wbtcMarket: '0xa9b050Bf7a714B5f43B3178c1E5e4d4eAE1584FF',
    wethMarket: '0x0F9a8be03cDD33E4E943d205c0B0Db1a3f1cF380',
    odexMarket: '0xE5Bca9b164cC27D9F845F641782aeFc77d62d4FC'
}

const copyToClipboard = async (containerid) => {
    let range;
    if (document.selection) { 
        range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select().createTextRange();
        document.execCommand("Copy"); 
    } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("Copy");
    }
}

const socials = `<div class="flex-rown flex-end"><a href="https://twitter.com/odexfi" target="_blank"><img src="./images/twitter.png" class="social-icon" /></a><a href="https://github.com" target="_blank"><img src="./images/github.png" class="social-icon" /></a><a href="https://odex.substack.com" target="_blank"><img src="./images/newsletter.png" class="social-icon" /></a></div>`;

const loadMarkets = async () => {
    document.querySelector('.load-markets .footer-icon').setAttribute("src", './images/icon-markets-selected.png');
    document.querySelector('.load-wallets .footer-icon').setAttribute("src", './images/icon-wallets.png');
    document.querySelector('.load-trade .footer-icon').setAttribute("src", './images/icon-trade.png');
    await fetch('./markets.html').then(response => response.text()).then((responseText) => {
        document.getElementById('content').innerHTML = responseText;
    });
    const wallets = JSON.parse(localStorage.wallets);
    const connectedWallet = localStorage.connectedWallet || 0;
    const topWallet = `<div id="markets-wallet"><img class="markets-wallet-icon" src="./images/icon-wallets-selected.png" /> ${wallets[connectedWallet].name}</div>`;
    document.getElementById('top-right').innerHTML = topWallet;
    document.getElementById('markets-wallet').onclick = loadWallets;
    document.getElementById('link-latest-markets').onclick = () => alert('Coming Soon');
    document.getElementById('link-add-market').onclick = () => alert('Coming Soon');
    await fetch('./components/market.html').then(response => response.text()).then(async (responseText) => {
        let mHTML = '';
        const markets = JSON.parse(localStorage.markets);
        let index = 0;
        for (const market of markets) {
            let marketImage = `<img class="market-icon" src="./images/market-misc.png" />`;
            if (market.image) marketImage = `<img class="market-icon" src="./images/${market.image}" />`;
            const marketPair = `${market.token}/${market.baseAsset}`;
            const price = await priceLookup(market.token);
            const divPrice = BigInt(price) / 1000000n;
            const formattedPrice =  `$${divPrice.toString()}`;
            const button = `<button class="trade-button" data-market="${index}">TRADE</button>`;
            mHTML += responseText
            .replace('<!-- market-image -->', marketImage)
            .replace('<!-- market-pair -->', marketPair)
            .replace('<!-- market-price -->', formattedPrice)
            .replace('<!-- market-button -->', button);
            index += 1;
        }
        document.getElementById('markets-container').innerHTML = mHTML;
    });
    document.querySelectorAll('.trade-button').forEach(a => a.addEventListener('click', e => {
        const marketIndex = e.target.getAttribute("data-market");
        localStorage.setItem('lastMarket', marketIndex);
        loadTrade();
    }));
}

/* Wallets */

const backupWallet = async () => {
    const virtualWallet = loadWallet();
    prompt("Your Private Key", virtualWallet.privateKey);
}

const restoreWallet = async () => {
    const pk = prompt('Enter a private key');
    const tmpWallet = new ethers.Wallet(pk);
    const wallets = JSON.parse(localStorage.wallets);
    wallets.push({ name: `Imported Wallet`, privateKey: tmpWallet.privateKey, address: tmpWallet.address });
    const connectedWallet = wallets.length - 1;
    localStorage.setItem('connectedWallet', connectedWallet);
    localStorage.setItem('wallets', JSON.stringify(wallets));
    loadWallets();
}

const removeWallet = async () => {
    if (confirm("Are you sure you want to permanently delete wallet?")) {
        let wallets = JSON.parse(localStorage.wallets);
        wallets.splice(localStorage.connectedWallet, 1);
        if (wallets.length == 0) {
            alert('Creating new virtual wallet as no virtual wallets currently exist');
            const wallet1 = ethers.Wallet.createRandom();
            wallets = [{ name: 'New Wallet', privateKey: wallet1.privateKey, address: wallet1.address }];
        }
        localStorage.setItem('wallets', JSON.stringify(wallets));
        localStorage.setItem('connectedWallet', 0);
    }
    loadWallets();
}

const addWallet = async () => {
    const wallets = JSON.parse(localStorage.wallets);
    const wallet1 = ethers.Wallet.createRandom();
    wallets.push({ name: 'New Wallet', privateKey: wallet1.privateKey });
    localStorage.setItem('wallets', JSON.stringify(wallets));
    localStorage.setItem('connectedWallet', wallets.length - 1);
    loadWallets();
}

const renameWallet = async () => {
    const name = prompt('Enter a new wallet name');
    const wallets = JSON.parse(localStorage.wallets);
    wallets[localStorage.connectedWallet].name = name;
    localStorage.setItem('wallets', JSON.stringify(wallets));
    loadWallets();
}

const initAccount = async () => {
    const wallet1 = ethers.Wallet.createRandom();
    const wallet2 = ethers.Wallet.createRandom();
    const wallet3 = ethers.Wallet.createRandom();
    const wallets = [
        { name: 'Wallet 1', privateKey: wallet1.privateKey, address: wallet1.address },
        { name: 'Wallet 2', privateKey: wallet2.privateKey, address: wallet2.address },
        { name: 'Wallet 3', privateKey: wallet3.privateKey, address: wallet3.address },
    ];
    localStorage.setItem('wallets', JSON.stringify(wallets));
    localStorage.setItem('connectedWallet', 0);
    const assets = [
        { symbol: 'wBTC', name: 'Wrapped Bitcoin', address: contracts.wbtc, decimals: 18, image: 'asset-wbtc.png' },
        { symbol: 'wETH', name: 'Wrapped Ether', address: contracts.weth, decimals: 18, image: 'asset-weth.png' },
        { symbol: 'ODEX', name: 'ODEX Governance Token', address: contracts.odexToken, decimals: 18, image: 'asset-odex.png' },
        { symbol: 'USDC', name: 'Goerli USDC', address: contracts.usd, decimals: 6, image: 'asset-usdc.png' },
    ];
    localStorage.setItem('assets', JSON.stringify(assets));
    const markets = [
        { token: 'wBTC', baseAsset: 'USDC', tokenAddress: contracts.wbtc, baseAssetAddress: contracts.usd, poolId: 0, address: contracts.wbtcMarket, image: 'market-wbtcusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 },
        { token: 'wETH', baseAsset: 'USDC', tokenAddress: contracts.weth, baseAssetAddress: contracts.usd, poolId: 1, address: contracts.wethMarket, image: 'market-wethusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 },
        { token: 'ODEX', baseAsset: 'USDC', tokenAddress: contracts.odexToken, baseAssetAddress: contracts.usd, poolId: 2, address: contracts.odexMarket, image: 'market-odexusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 },
    ];
    localStorage.setItem('markets', JSON.stringify(markets));
    localStorage.setItem('lastMarket', 1);
    localStorage.setItem('prices', '{}');
}

const loadWallet = () => {
    const wallets = JSON.parse(localStorage.wallets);
    const connectedWallet = localStorage.connectedWallet || 0;
    const loadWallet = new ethers.Wallet(wallets[connectedWallet].privateKey);
    const virtualWallet = loadWallet.connect(provider);
    virtualWallet.name = wallets[connectedWallet].name;
    return virtualWallet;
}

const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function deposit() payable",
    "function withdraw(uint256)",
];

const odexAbi = [
    "function tvl() view returns (uint)",
    "function volume() view returns (uint)",
    "function odexCount() view returns (uint)",
];

const odexMarketsAbi = [
    "function tvl() view returns (uint)",
    "function midPrice() view returns (uint)",
    "function orderbook() view returns (uint[100] memory, uint[100] memory, address[100] memory, uint[100] memory, uint[100] memory, address[100] memory)",
    "function limitOrderBuy(uint _amount, uint _price) returns (uint)",
    "function limitOrderSell(uint _amount, uint _price) returns (uint)",
];

const balanceLookup = async (assetSymbol) => {
    const virtualWallet = loadWallet();
    const assets = JSON.parse(localStorage.assets);
    for (const asset of assets) {
        if (assetSymbol == asset.symbol) {
            try {
                const contract = new ethers.Contract(asset.address, erc20Abi, provider);
                const balance = await contract.balanceOf(virtualWallet.address);
                return balance;
            } catch (e) {
                console.log('app.js e187 balanceLookup failed');
            }
        }
    }
    return 0;
}

const priceLookup = async (assetSymbol) => {
    if (assetSymbol.includes('USD')) return 1000000n;
    const unixTimestamp = Math.floor(Date.now() / 1000);
    // Avoid hitting the RPC node too often
    const prices = JSON.parse(localStorage.getItem('prices'));
    if (prices && prices[assetSymbol] && prices[assetSymbol].lastUpdate > unixTimestamp - 60) {
        return prices[assetSymbol].price;
    }
    let odexAddress;
    if (assetSymbol.includes('BTC')) odexAddress = contracts.wbtcMarket;
    if (assetSymbol.includes('ETH')) odexAddress = contracts.wethMarket;
    if (assetSymbol.includes('ODEX')) odexAddress = contracts.odexMarket;
    if (odexAddress) {
        try {
            const contract = new ethers.Contract(odexAddress, odexMarketsAbi, provider);
            const price = await contract.midPrice();
            prices[assetSymbol] = { price: price.toString(), lastUpdate: unixTimestamp };
            localStorage.prices = JSON.stringify(prices);
            return price;
        } catch (e) {
            console.log('app.js e164 priceLookup failed',e);
            return 0;
        }
    } else {
        return 0;
    }
}

const withdraw = async (assetId) => {
    const assets = JSON.parse(localStorage.assets);
    const asset = assets[assetId];
    document.getElementById('withdraw').style.display = 'flex';
    document.getElementById('withdraw-asset').innerHTML = asset.symbol;
    document.getElementById('button-withdraw-close').onclick = () => document.getElementById('withdraw').style.display = 'none';
    try {
        const virtualWallet = loadWallet();
        const contract = new ethers.Contract(asset.address, erc20Abi, provider);
        const wei = await contract.balanceOf(virtualWallet.address);
        const qty = ethers.formatUnits(wei, asset.decimals);
        document.getElementById('withdraw-balance').innerHTML = qty;
    } catch (e) {
        console.log('app.js e225 balanceOf failed');
    }
    document.getElementById('button-withdraw-confirm').setAttribute('data-asset', assetId);
    document.getElementById('button-withdraw-confirm').onclick = async (e) => {
        const assetId = e.target.getAttribute('data-asset');
        const assets = JSON.parse(localStorage.assets);
        const asset = assets[assetId];    
        const withdrawalAddress = document.getElementById('withdrawal-address').value;
        const rawAmount = document.getElementById('withdrawal-amount').value;
        console.log(rawAmount, typeof rawAmount, 'rawAmount');
        console.log(asset.decimals, typeof asset.decimals, 'asset.decimals');
        const amount = ethers.parseUnits(rawAmount, asset.decimals);
        if (!withdrawalAddress || rawAmount <= 0) {
            alert('Address or amount incorrectly formatted');
            loadWallets();
            return false;
        }
        try {
            const virtualWallet = loadWallet();
            const contract = new ethers.Contract(asset.address, erc20Abi, virtualWallet);
            const tx = await contract.transfer(address, amount);
            prompt('Transaction confirmed! TX Hash:', tx.hash);
        } catch (e) {
            alert('app.js e206 Transaction error');
        }
        loadWallets();
    }
}

const getWalletValue = async (address) => {
    const assets = JSON.parse(localStorage.assets);
    let value = 0n;
    for (const asset of assets) {
        try {
            const contract = new ethers.Contract(asset.address, erc20Abi, provider);
            let wei = await contract.balanceOf(address);
            // add ETH to WETH
            if (asset.symbol == 'wETH') {
                const ethWei = await provider.getBalance(address);
                wei += ethWei;
            }
            const balance = ethers.formatUnits(wei, asset.decimals);
            const price = await priceLookup(asset.symbol);
            const addition = BigInt(Math.round((Number(balance) * Number(price)))) / 1000000n;
            value += addition;
        } catch (e) {
            console.log('app.js e183 getWalletValue failed',e)
        }
   }
    return value;
}

const wrapEth = async () => {
    const virtualWallet = loadWallet();
    const balanceWei = await provider.getBalance(virtualWallet.address);
    const balanceEther = ethers.formatEther(balanceWei);
    const preAmount = prompt(`Enter an amount to wrap, do not wrap your entire balance as you will need some to pay gas fees. Balance: ${balanceEther} ETH`);
    const value = ethers.parseEther(preAmount);
    try {
        const contract = new ethers.Contract(contracts.weth, erc20Abi, virtualWallet);
        const tx = await contract.deposit({value});
        tx.wait();
        prompt('Transaction confirmed! TX Hash:', tx.hash);
    } catch (e) {
        alert('app.js e272 wrapEth transaction error');
    }
    loadWallets();
}

const unwrapEth = async () => {
    const virtualWallet = loadWallet();
    const contract = new ethers.Contract(contracts.weth, erc20Abi, virtualWallet);
    const balanceWei = await contract.balanceOf(virtualWallet.address);
    const balanceWeth = ethers.formatEther(balanceWei);
    const preAmount = prompt(`Enter an amount to unwrap. Balance: ${balanceWeth} wETH`);
    const value = ethers.parseEther(preAmount);
    try {
        const tx = await contract.withdraw(value);
        tx.wait();
        prompt('Transaction confirmed! TX Hash:', tx.hash);
    } catch (e) {
        alert('app.js e287 unwrapEth transaction error');
    }
    loadWallets();
}

const loadWallets = async () => {
    document.querySelector('.load-markets .footer-icon').setAttribute("src", './images/icon-markets.png');
    document.querySelector('.load-wallets .footer-icon').setAttribute("src", './images/icon-wallets-selected.png');
    document.querySelector('.load-trade .footer-icon').setAttribute("src", './images/icon-trade.png');
    await fetch('./wallets.html').then(response => response.text()).then((responseText) => {
        document.getElementById('content').innerHTML = responseText;
    });
    document.getElementById('top-right').innerHTML = socials;
    document.getElementById('connected-wallets-link').onclick = () => alert('Coming Soon');
    document.getElementById('import-tokens').onclick = () => alert('Coming Soon');
    document.getElementById('link-add-wallet').onclick = addWallet;
    document.getElementById('link-rename').onclick = renameWallet;
    document.getElementById('button-backup').onclick = backupWallet;
    document.getElementById('button-restore').onclick = restoreWallet;
    document.getElementById('button-remove').onclick = removeWallet;
    document.getElementById('button-deposit').onclick = () => document.getElementById('deposit').style.display = 'flex';
    document.getElementById('button-deposit-close').onclick = () => document.getElementById('deposit').style.display = 'none';
    document.getElementById('button-deposit-copy').onclick = () => copyToClipboard('deposit-address');
    document.getElementById('copy-wallet-address').onclick = () => copyToClipboard('wallet-address');
    const virtualWallet = loadWallet();
    document.getElementById('wallet-address').innerHTML = virtualWallet.address;
    document.getElementById('deposit-address').innerHTML = virtualWallet.address;
    document.getElementById('deposit-qr').innerHTML = `<img src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${virtualWallet.address}&choe=UTF-8" class="qr-code responsive-image" />`;
    document.getElementById('wallet-name').innerHTML = virtualWallet.name;
    try {
        const balanceWei = await provider.getBalance(virtualWallet.address);
        const balanceEther = ethers.formatEther(balanceWei);
        document.getElementById('wallet-ether').innerHTML = `${balanceEther.substr(0,8)}<span class="text-small"> ETH</span>`;
    } catch (e) {
        console.log('app.js e213 getBalance failed',e);
    }
    const walletValue = await getWalletValue(virtualWallet.address);
    if (!document.getElementById('wallet-value')) return false;
    document.getElementById('wallet-value').innerHTML = `$${walletValue.toString()}`;
    await fetch('./components/wallet-asset.html').then(response => response.text()).then(async (responseText) => {
        let aHTML = '';
        const assets = JSON.parse(localStorage.assets);
        let assetId = 0;
        for (const asset of assets) {
            let assetImage = `<img class="asset-icon" src="./images/asset-misc.png" />`;
            if (asset.image) assetImage = `<img class="asset-icon" src="./images/${asset.image}" />`;
            const price = await priceLookup(asset.symbol);
            const divPrice = BigInt(price) / 1000000n;
            const formattedPrice =  `$${divPrice.toString()}`;
            let qty = 0;
            try {
                const contract = new ethers.Contract(asset.address, erc20Abi, provider);
                const wei = await contract.balanceOf(virtualWallet.address);
                qty = ethers.formatUnits(wei, asset.decimals);
            } catch (e) {
                console.log('app.js e225 balanceOf failed');
            }
            let additional = '';
            const wethButtons = `<button id="weth-wrap" class="button-small">WRAP ETH</button> <button id="weth-unwrap" class="button-small">UNWRAP</button>`
            if (asset.symbol == 'wETH') additional = wethButtons;

            aHTML += responseText
                .replace('<!-- asset-image -->', assetImage)
                .replace('<!-- asset-symbol -->', asset.symbol)
                .replace('<!-- asset-price -->', formattedPrice)
                .replace('<!-- asset-qty -->', `${qty.toString().substr(0,10)}`)
                .replace('<!-- asset-withdraw -->', `<button class="withdraw-button" data-asset="${assetId}">WITHDRAW</button>`)
                .replace('<!-- asset-additional -->', additional);
            assetId += 1;
        }
        if (!document.getElementById('wallet-assets')) return false;
        document.getElementById('wallet-assets').innerHTML = aHTML;
        document.querySelectorAll('.withdraw-button').forEach(a => a.addEventListener('click', e => {
            const assetId = e.target.getAttribute('data-asset');
            withdraw(assetId);
        }));
        document.getElementById('weth-wrap').onclick = wrapEth;
        document.getElementById('weth-unwrap').onclick = unwrapEth;
    });
    await fetch('./components/wallet-disconnected.html').then(response => response.text()).then(async (responseText) => {
        const diconnectedWallets = JSON.parse(localStorage.wallets);
        let walletId = 0;
        let dwHTML = '';
        for (const dWallet of diconnectedWallets) {
            if (walletId !== Number(localStorage.connectedWallet)) {
                const dWalletValue = await getWalletValue(dWallet.address);
                const newHTML= responseText
                    .replace('switch-wallet', walletId.toString())
                    .replace('<!-- wallet-name -->', dWallet.name)
                    .replace('<!-- wallet-address -->', dWallet.address)
                    .replace('<!-- wallet-value -->', `$${dWalletValue.toString()}`);
                dwHTML += newHTML;
            }
            walletId += 1;
        }
        if (!document.getElementById('disconnected-wallets')) return false;
        document.getElementById('disconnected-wallets').innerHTML = dwHTML;
        document.querySelectorAll('.disconnected-wallet-container').forEach(a => a.addEventListener('click', e => {
            const walletId = e.target.getAttribute('data-switch') || e.target.closest('.disconnected-wallet-container').getAttribute('data-switch')
            localStorage.setItem('connectedWallet', walletId);
            loadWallets();
        }));
    });
}

const loadTrade = async () => {
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    document.querySelector('.load-markets .footer-icon').setAttribute("src", './images/icon-markets.png');
    document.querySelector('.load-wallets .footer-icon').setAttribute("src", './images/icon-wallets.png');
    document.querySelector('.load-trade .footer-icon').setAttribute("src", './images/icon-trade-selected.png');
    if (!localStorage.lastMarket) localStorage.setItem('lastMarket', 1);
    await fetch('./trade.html').then(response => response.text()).then((responseText) => {
        document.getElementById('content').innerHTML = responseText;
    });
    const priceLiquidity = document.getElementById('price-liquidity').getBoundingClientRect();
    const headerContainer = document.getElementById('header-container').getBoundingClientRect();
    if (priceLiquidity.top < headerContainer.bottom) {
        document.getElementById('price-liquidity').style.display = 'none';
    } else {
        try {
            const contract = new ethers.Contract(market.address, odexMarketsAbi, provider);
            const tvl = await contract.tvl();
            const divTVL = BigInt(tvl) / 1000000n;
            const formattedTVL = `$${divTVL.toString()}`;
            document.getElementById('trade-liquidity').innerHTML = formattedTVL;
        } catch (e) {
            console.log('app.js e413 tvl failed');
        }
        const price = await priceLookup(market.token);
        const divPrice = BigInt(price) / 1000000n;
        const formattedPrice =  `$${divPrice.toString()}`;
        document.getElementById('trade-price').innerHTML = formattedPrice;
    }
    const topMarket = `<div id="trade-market"><div class="market-title">${market.token}/${market.baseAsset}</div> <img src="./images/${market.image || 'market-misc.png'}" class="trade-icon" /></div>`;
    document.getElementById('top-right').innerHTML = topMarket;
    document.getElementById('trade-market').onclick = loadMarkets;
    const baseAssetBalance = await balanceLookup(market.baseAsset);
    const tokenBalance = await balanceLookup(market.token);
    const formattedBaseAssetBalance = ethers.formatUnits(baseAssetBalance, market.baseAssetDecimals).toString().substr(0,10);
    const formattedTokenBalance = ethers.formatUnits(tokenBalance, market.tokenDecimals).toString().substr(0,10);
    document.getElementById('base-range').setAttribute('max',formattedBaseAssetBalance);
    document.getElementById('token-range').setAttribute('max',formattedTokenBalance);
    document.getElementById('base-range').setAttribute('step',1 / (10 ** market.baseAssetDecimals));
    document.getElementById('token-range').setAttribute('step',1 / (10 ** market.tokenDecimals));
    document.getElementById('base-balance').innerHTML = `<span class="text-small">${market.baseAsset} Balance: </span>${formattedBaseAssetBalance}`;
    document.getElementById('token-balance').innerHTML = `<span class="text-small">${market.token} Balance: </span>${formattedTokenBalance}`;
    document.getElementById('amount-base-label').innerHTML = `Ammount ${market.baseAsset}`;
    document.getElementById('amount-token-label').innerHTML = `Ammount ${market.token}`;
    document.getElementById('buy-button').innerHTML = `BUY ${market.token}`;
    document.getElementById('sell-button').innerHTML = `SELL ${market.token}`;
    document.getElementById('base-range').addEventListener("input", (e) => {
        document.getElementById('base-amount').innerHTML = e.target.value.toString().substr(0,8);
    });
    document.getElementById('token-range').addEventListener("input", (e) => {
        document.getElementById('token-amount').innerHTML = e.target.value.toString().substr(0,8);
    });
    document.getElementById('buy-button').onclick = () => {
        localStorage.setItem('order',JSON.stringify({...market, type: 'BUY', amount: document.getElementById('base-range').value}));
        loadOrder();
    }
    document.getElementById('sell-button').onclick = () => {
        localStorage.setItem('order',JSON.stringify({...market, type: 'SELL', amount: document.getElementById('token-range').value}));
        loadOrder();
    }
    const ob = await refreshOrderBook();
    for (let i = 0; i < 6; i++) {
        document.getElementById(`bid-amount-${i}`).innerHTML = ethers.formatUnits(ob.groupedBids[i][0].toString(), market.baseAssetDecimals).substr(0,6);
        document.getElementById(`bid-price-${i}`).innerHTML = ethers.formatUnits(ob.groupedBids[i][1].toString(), market.baseAssetDecimals);
        document.getElementById(`ask-amount-${i}`).innerHTML = ethers.formatUnits(ob.groupedAsks[i][0].toString(), market.tokenDecimals).substr(0,6);
        document.getElementById(`ask-price-${i}`).innerHTML = ethers.formatUnits(ob.groupedAsks[i][1].toString(), market.baseAssetDecimals);
    }
    checkApprovals();
    const tradingViewAssets = {
        'wBTC': 'COINBASE:BTCUSD',
        'wETH': 'COINBASE:ETHUSD',
        'ODEX': 'COINBASE:ODEXUSD',
    }
    new TradingView.widget({
        "autosize": true,
        "symbol": tradingViewAssets[market.token],
        "interval": "60",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_legend": true,
        "hide_side_toolbar": false,
        "save_image": false,
        "container_id": "tradingview-chart"
  });
}

const refreshOrderBook = async () => {
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    const contract = new ethers.Contract(market.address, odexMarketsAbi, provider);
    const ob = await contract.orderbook(); // [amounts[100],prices[100]]
    const sortedBids = [];
    const sortedAsks = [];
    for (let i = 0; i < 100; i++) {
        if (ob[1][i] > 0n)
            sortedBids.push([ob[0][i],ob[1][i],ob[2][i]]); // [[amount,price,trader],[amount,price,trader],...]
        if (ob[4][i] > 0n)
            sortedAsks.push([ob[3][i],ob[4][i],ob[5][i]]);
    }
    for (let i = 0; i < sortedBids.length - 1; i++) {
        for (let j = 0; j < sortedBids.length - i - 1; j++) {
            const currentBid = sortedBids[j];
            const nextBid = sortedBids[j + 1];
            if (nextBid[1] > currentBid[1]) { // Swap bids if next price higher
                sortedBids[j] = nextBid;
                sortedBids[j + 1] = currentBid;
            } else if (nextBid[1] === currentBid[1]) {
                if (nextBid[0] > currentBid[0]) { // If prices equal, compare amounts
                    sortedBids[j] = nextBid;
                    sortedBids[j + 1] = currentBid;
                }
            }
        }
    }
    for (let i = 0; i < sortedAsks.length - 1; i++) {
        for (let j = 0; j < sortedAsks.length - i - 1; j++) {
            const currentAsk = sortedAsks[j];
            const nextAsk = sortedAsks[j + 1];
            if (nextAsk[1] < currentAsk[1]) {
                sortedAsks[j] = nextAsk;
                sortedAsks[j + 1] = currentAsk;
            } else if (nextAsk[1] === currentAsk[1]) {
                if (nextAsk[0] > currentAsk[0]) {
                    sortedAsks[j] = nextAsk;
                    sortedAsks[j + 1] = currentAsk;
                }
            }
        }
    }
    // Group Same Priced Bids And Aggregate Amounts
    let lastPrice;
    const groupedBids = [];
    for (let i = 0; i < sortedBids.length; i++) {
        if (sortedBids[i][1] == lastPrice) {
            groupedBids[groupedBids.length -1][0] += sortedBids[i][0];
        } else {
            groupedBids[groupedBids.length] = sortedBids[i];
        }        
        lastPrice = sortedBids[i][1]
    }
    const groupedAsks = [];
    for (let i = 0; i < sortedAsks.length; i++) {
        if (sortedAsks[i][1] == lastPrice) {
            groupedAsks[groupedAsks.length -1][0] += sortedAsks[i][0];
        } else {
            groupedAsks[groupedAsks.length] = sortedAsks[i];
        }        
        lastPrice = sortedAsks[i][1]
    }
    // Fill in blanks
    for (let i = 0; i < 6; i++) {
        if (!groupedBids[i]) groupedBids[i] = [0n,0n];
        if (!groupedAsks[i]) groupedAsks[i] = [0n,0n];
    }
    return { bids: sortedBids, asks: sortedAsks, groupedBids, groupedAsks }
}

const updatePrice = async () => {
    const order = JSON.parse(localStorage.order);
    const ob = await refreshOrderBook();
    const priceValues = [
        ob.groupedBids[5][1],ob.groupedBids[4][1],ob.groupedBids[3][1],ob.groupedBids[2][1],ob.groupedBids[1][1],ob.groupedBids[0][1],
        ob.groupedAsks[0][1],ob.groupedAsks[1][1],ob.groupedAsks[2][1],ob.groupedAsks[3][1],ob.groupedAsks[4][1],ob.groupedAsks[5][1],
    ];
    for (let i = 0; i < 6; i++) {
        document.getElementById(`bid-amount-${i}`).innerHTML = ethers.formatUnits(ob.groupedBids[i][0].toString(), order.baseAssetDecimals).substr(0,6);
        document.getElementById(`bid-price-${i}`).innerHTML = ethers.formatUnits(ob.groupedBids[i][1].toString(), order.baseAssetDecimals);
        document.getElementById(`ask-amount-${i}`).innerHTML = ethers.formatUnits(ob.groupedAsks[i][0].toString(), order.tokenDecimals).substr(0,6);
        document.getElementById(`ask-price-${i}`).innerHTML = ethers.formatUnits(ob.groupedAsks[i][1].toString(), order.baseAssetDecimals);
    }
    const priceRange = document.getElementById('price-range');
    order.price = priceValues[priceRange.value];
    document.getElementById('price-confirm').innerHTML = ethers.formatUnits(order.price, order.baseAssetDecimals);
    let fill = `<span class="orange">0%</span>`;
    if (order.type == 'BUY') {
        if (priceRange.value < 2) fill = `<span class="red">0%</span>`;
        if (priceRange.value > 5) fill = `<span class="green">100%</span>`;
        document.getElementById('amount-in').innerHTML = `${order.amount} ${order.baseAsset}`;
        const amountOut = ethers.parseUnits(order.amount.toString(), order.baseAssetDecimals) * ethers.parseUnits('1',order.tokenDecimals) / order.price;
        let afterFees = amountOut;
        if (priceRange.value > 5) afterFees = afterFees * 999n / 1000n;
        document.getElementById('amount-out').innerHTML = `${ethers.formatUnits(amountOut, order.tokenDecimals).toString().substr(0,12)} ${order.token}`;
        document.getElementById('after-fees').innerHTML = `${ethers.formatUnits(afterFees, order.tokenDecimals).toString().substr(0,12)}`;
        order.amountString = ethers.parseUnits(order.amount, order.baseAssetDecimals).toString();
    } else if (order.type == 'SELL') {
        if (priceRange.value > 9) fill = `<span class="red">0%</span>`;
        if (priceRange.value < 6) fill = `<span class="green">100%</span>`;
        document.getElementById('amount-in').innerHTML = `${order.amount} ${order.token}`;
        const amountOut = ethers.parseUnits(order.amount.toString(), order.tokenDecimals) * order.price / ethers.parseUnits('1',order.tokenDecimals);
        let afterFees = amountOut;
        if (priceRange.value > 5) afterFees = afterFees * 999n / 1000n;
        document.getElementById('amount-out').innerHTML = `${ethers.formatUnits(amountOut, order.baseAssetDecimals).toString().substr(0,12)} ${order.baseAsset}`;
        document.getElementById('after-fees').innerHTML = `${ethers.formatUnits(afterFees, order.baseAssetDecimals).toString().substr(0,12)}`;
        order.amountString = ethers.parseUnits(order.amount, order.tokenDecimals).toString();
    }
    document.getElementById('fill-confirm').innerHTML = fill;
    order.priceString = order.price.toString();
    delete order.price;
    localStorage.setItem('order',JSON.stringify(order));
};

const checkApprovals = async () => {
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    const virtualWallet = loadWallet();
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const baseAsset = new ethers.Contract(market.baseAssetAddress, erc20Abi, virtualWallet);
    const baseBalance = await baseAsset.balanceOf(virtualWallet.address);
    const baseAllowance = await baseAsset.allowance(virtualWallet.address, market.address);
    const token = new ethers.Contract(market.tokenAddress, erc20Abi, virtualWallet);
    const tokenBalance = await token.balanceOf(virtualWallet.address);
    const tokenAllowance = await token.allowance(virtualWallet.address, market.address);
    if (baseAllowance < baseBalance) {
        console.log('Approving baseAsset Spend');
        const tx1 = await baseAsset.approve(market.address, maxUint256);
        await tx1.wait();
    }
    if (tokenAllowance < tokenBalance) {
        console.log('Approving token Spend');
        const tx2 = await token.approve(market.address, maxUint256);
        await tx2.wait();
    }
    document.getElementById('buy-button').classList.add('green-bkg');
    document.getElementById('sell-button').classList.add('red-bkg');
}

const confirmOrder = async () => {
    document.getElementById('confirm-buttons').innerHTML = '<p class="text-center faded">BROADCASTING...</p>'
    const order = JSON.parse(localStorage.order);
    const virtualWallet = loadWallet();
    console.log(order);
    const odexMarket = new ethers.Contract(order.address, odexMarketsAbi, virtualWallet);
    if (order.type == 'BUY') {  
        const tx1 = await odexMarket.limitOrderBuy(order.amountString, order.priceString);
        await tx1.wait();
        prompt('BUY Confirmed! TX Hash:', tx1.hash);
    } else if (order.type == 'SELL') {
        const tx2 = await odexMarket.limitOrderSell(order.amountString, order.priceString);
        await  tx2.wait();
        prompt('SELL Confirmed! TX Hash:', tx2.hash);
    }
    loadWallets();
}

const loadOrder = async () => {
    const order = JSON.parse(localStorage.order);
    await fetch('./order.html').then(response => response.text()).then((responseText) => {
        document.getElementById('content').innerHTML = responseText;
        document.getElementById('price-range').oninput = (e) => updatePrice();
    });
    const topMarket = `<div id="trade-market"><div class="market-title">${order.token}/${order.baseAsset}</div> <img src="./images/${order.image || 'market-misc.png'}" class="trade-icon" /></div>`;
    document.getElementById('top-right').innerHTML = topMarket;
    document.getElementById('trade-market').onclick = loadMarkets;
    document.getElementById('order-cancel').onclick = loadTrade;
    document.getElementById('order-confirm').onclick = confirmOrder;
    if (order.type == 'SELL') document.getElementById('price-range').value = 5;
    updatePrice();
}

const setupApp = async () => {
    document.querySelectorAll('.load-markets').forEach(a => a.addEventListener('click', e => {
        loadMarkets();
    }));
    document.querySelectorAll('.load-wallets').forEach(a => a.addEventListener('click', e => {
        loadWallets();
    }));
    document.querySelectorAll('.load-trade').forEach(a => a.addEventListener('click', e => {
        loadTrade();
    }));
    if (!localStorage.wallets) await initAccount();
    loadWallets();
    //localStorage.setItem('order',JSON.stringify({ type: 'BUY', amount: 500, token: 'wETH', baseAsset: 'USDC', poolId: 1, address: contracts.wethMarket, image: 'market-wethusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 }));
    //loadTrade()
}

const formattedNumber = (n) => {
    return n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}    

const setupIndex = async () => {
    document.getElementById('whitepaper-button').onclick = () => {
        window.open('./ODEXwhitepaper.pdf');
    }
    document.getElementById('install-button').onclick = () => {
        document.getElementById('install').style.display = 'flex';
    }
    document.getElementById('instructions-close').onclick = () => {
        document.getElementById('install').style.display = 'none';
    }
    document.getElementById('top-right').innerHTML = socials;
    const instructions = {
        safari: `In your browser tap the "Share" icon and choose "Add to Home Screen" then "Add" to confirm. Open the app from the homescreen or app list`,
        chrome: `In your Chrome browser menu "⋮", tap the "Install App". Then open the app icon from your home screen or app list.`,
        other: `Please install this App on your home page using your mobile device. Recommended browsers iPhone Safari, Android Chrome`,
    }
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) {
        document.getElementById('instructions').innerHTML = instructions.safari;
    } else if (ua.includes('android')) {
        document.getElementById('instructions').innerHTML = instructions.chrome;
    } else {
        document.getElementById('instructions').innerHTML = instructions.other;
    }
    try {
        const contract = new ethers.Contract(contracts.odex, odexAbi, provider);
        const tvl = await contract.tvl();
        document.getElementById('index-tvl').innerHTML = formattedNumber(Number(ethers.formatUnits(tvl, 6)));
        const volume = await contract.volume();
        document.getElementById('index-volume').innerHTML = formattedNumber(Number(ethers.formatUnits(volume, 6)));
        const odexCount = await contract.odexCount();
        document.getElementById('index-markets').innerHTML = odexCount;
    } catch (e) {
        console.log('app.js e732 indexStats failed',e);
    }
}

if (document.querySelectorAll('.index-section').length > 1) {
    setupIndex();
} else {
    setupApp();
}




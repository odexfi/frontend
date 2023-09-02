import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

let provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io');

const contracts = {
    odex: '0x47ff9F59bE0191B3aEbcC860A9CF191A964768cc',
    odexFactory: '0x3b7de01a78Be109D320bc1aEFCA344D2849d2855',
    wbtc: '0xad0213fF940c820555BEdFc1F01E48691d3EAe82',
    weth: '0xc37B690b7776711acF9b34b4FdBb4298F40D424D',
    usd: '0x1470eDbBBDac9FCe37694C63e2DaFc84f6D6a8b7',
    odexToken: '0xB1a4c334477216F56325F0977dF82a5E97C4F915',
    wbtcMarket: '0x4683b0bf140176c78b11A5c17025C487D9c4a77a',
    wethMarket: '0x1F9C4aDFa71b4b8baDDd81c28E169f149840d30B',
    odexMarket: '0xe9860F28d05Ee28F1DF68D966A663B857069fd66'
  }

const api = 'https://api.odex.fi/v1/';

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

const refreshRate = 15 * 1000;

const formatUSD = (n) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const socials = `<div class="flex-rown flex-end"><a href="https://twitter.com/odexfi" target="_blank"><img src="./images/twitter.png" class="social-icon" /></a><a href="https://github.com/odexfi" target="_blank"><img src="./images/github.png" class="social-icon" /></a><a href="https://odex.substack.com" target="_blank"><img src="./images/newsletter.png" class="social-icon" /></a><a href="https://odexfi.gitbook.io/docs/" target="_blank"><img src="./images/docs.png" class="social-icon" /></a></div>`;

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
            const formattedPrice =  formatUSD(divPrice);
            const buttons = `<button class="button-close red-bkg remove-market" data-market="${index}">X</button> <button class="button-small trade-button" data-market="${index}">TRADE</button>`;
            mHTML += responseText
            .replace('<!-- market-image -->', marketImage)
            .replace('<!-- market-pair -->', marketPair)
            .replace('<!-- market-price -->', formattedPrice)
            .replace('<!-- market-buttons -->', buttons);
            index += 1;
        }
        document.getElementById('markets-container').innerHTML = mHTML; 
    });
    document.querySelectorAll('.trade-button').forEach(a => a.addEventListener('click', e => {
        const marketIndex = e.target.getAttribute("data-market");
        localStorage.setItem('lastMarket', marketIndex);
        loadTrade();
    }));
    document.querySelectorAll('.remove-market').forEach(a => a.addEventListener('click', e => {
        const marketIndex = e.target.getAttribute("data-market");
        const markets = JSON.parse(localStorage.markets);
        markets.splice(marketIndex, 1);
        localStorage.setItem('markets', JSON.stringify(markets));
        loadMarkets();
    }));
    document.getElementById('link-top-markets').onclick = loadMarkets;
    document.getElementById('link-latest-markets').onclick = () => listMarkets();
    document.getElementById('find-market').onclick = findMarket;
    document.getElementById('create-market').onclick = createMarket;
}

const findMarket = () => {
    const tokenFilter = prompt('Enter a token contract address to search for');
    listMarkets(tokenFilter);
}

const listMarkets = async (tokenFilter=false) => {
    const contract = new ethers.Contract(contracts.odex, odexAbi, provider);
    const odexCount = await contract.odexCount();
    const assets = JSON.parse(localStorage.assets);
    let oHTML = `<table class="market-table"><tbody><tr class="orange"><td>Token</td><td>Base Asset</td><td>Volume</td><td>Actions</td></tr>`;
    for (let i = odexCount - 1n; i >= 0n; i--) {
        const oi = await contract.odexs(i);
        if (tokenFilter && oi[2] !== tokenFilter) continue;
        const baseAsset = new ethers.Contract(oi[3], erc20Abi, provider);
        const baseAssetSymbol = await baseAsset.symbol();
        const baseAssetDecimals = await baseAsset.decimals();
        let volume = Number(ethers.formatUnits(oi[11].toString(),baseAssetDecimals)).toFixed();
        if (baseAssetSymbol.includes('USD')) volume = formatUSD(volume);
        const token = new ethers.Contract(oi[2], erc20Abi, provider);
        const tokenSymbol = await token.symbol();
        const baseAssetLink = `<span class="green">${baseAssetSymbol}</span> <a href="https://goerli.etherscan.io/token/${oi[3]}" target="_blank">${oi[3].substr(0,8)}</a>`;
        const tokenLink = `<span class="green">${tokenSymbol}</span> <a href="https://goerli.etherscan.io/token/${oi[2]}" target="_blank">${oi[2].substr(0,8)}</a>`;
        oHTML += `<tr><td>${tokenLink}</td><td>${baseAssetLink}</td><td>${volume}</td><td><button class="button-small add-market" data-odex-index="${i}">ADD</button></td></tr>`;
        document.getElementById('markets-container').innerHTML = `<h2>Latest Markets</h2>${oHTML}</tbody></table>`;
        document.querySelectorAll('.add-market').forEach(a => a.addEventListener('click', e => {
            const marketId = e.target.getAttribute("data-odex-index");
            addMarket(marketId);
        }));
    }
}

const addMarket = async (marketId) => {
    const markets = JSON.parse(localStorage.markets);
    const contract = new ethers.Contract(contracts.odex, odexAbi, provider);
    const oi = await contract.odexs(marketId);
    const token = new ethers.Contract(oi[2], erc20Abi, provider);
    const baseAsset = new ethers.Contract(oi[3], erc20Abi, provider);
    const tokenSymbol = await token.symbol();
    const baseAssetSymbol = await baseAsset.symbol();
    const tokenDecimals = await token.decimals();
    const baseAssetDecimals = await baseAsset.decimals();
    const newMarket = {
        token: tokenSymbol,
        baseAsset: baseAssetSymbol,
        tokenAddress: oi[2],
        baseAssetAddress: oi[3],
        marketId,
        address: oi[0],
        image: 'market-misc.png',
        tokenDecimals: Number(tokenDecimals),
        baseAssetDecimals: Number(baseAssetDecimals),
    }
    markets.push(newMarket);
    localStorage.setItem('markets', JSON.stringify(markets));
}

const createMarket = async () => {
    await fetch('./components/markets-new.html').then(response => response.text()).then(async (responseText) => {
        document.getElementById('markets-container').innerHTML = responseText;
        document.getElementById('deploy-market').onclick = deployMarket;
    });
}

const deployMarket = async () => {
    document.getElementById('deploy-market-container').innerHTML = '<div class="faded">DEPLOYING...</div>';
    const virtualWallet = await loadWallet();
    const newToken = document.getElementById('new-token').value;
    const newBaseAsset = document.getElementById('new-base-asset').value;
    const newMinOrder = document.getElementById('new-min-order').value;
    const newTickRounding = document.getElementById('new-tick-rounding').value;
    try {
        const baseAsset = new ethers.Contract(newBaseAsset, erc20Abi, virtualWallet);
        const decimals = await baseAsset.decimals();
        const contract = new ethers.Contract(contracts.odexFactory, odexFactoryAbi, virtualWallet);
        const tx = await contract.deploy(newToken, newBaseAsset, ethers.parseUnits(newMinOrder,decimals), ethers.parseUnits(newTickRounding,decimals));
        tx.wait();
        alert('New market deployed, should be displayed on your markets page within 60 seconds');
        const contract2 = new ethers.Contract(contracts.odex, odexAbi, provider);
        const odexCount = await contract2.odexCount();
        addMarket(Number(odexCount-1n))
        listMarkets();
    } catch (e) {
        console.log('app.js e732 indexStats failed',e);
    }
}

/* Wallets */

const backupWallet = async () => {
    const virtualWallet = await loadWallet();
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
        { name: 'Wallet 1', privateKey: wallet1.privateKey, address: wallet1.address, type: 'virtual' },
        { name: 'Wallet 2', privateKey: wallet2.privateKey, address: wallet2.address, type: 'virtual' },
        { name: 'Wallet 3', privateKey: wallet3.privateKey, address: wallet3.address, type: 'virtual' },
    ];
    localStorage.setItem('wallets', JSON.stringify(wallets));
    localStorage.setItem('connectedWallet', 0);
    const assets = [
        { symbol: 'wBTC', name: 'Wrapped Bitcoin', address: contracts.wbtc, decimals: 18, image: 'asset-wbtc.png' },
        { symbol: 'wETH', name: 'Wrapped Ether', address: contracts.weth, decimals: 18, image: 'asset-weth.png' },
        { symbol: 'USDC', name: 'USDC', address: contracts.usd, decimals: 6, image: 'asset-usdc.png' },
    ];
    localStorage.setItem('assets', JSON.stringify(assets));
    const markets = [
        { token: 'wBTC', baseAsset: 'USDC', tokenAddress: contracts.wbtc, baseAssetAddress: contracts.usd, marketId: 0, address: contracts.wbtcMarket, image: 'market-wbtcusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 },
        { token: 'wETH', baseAsset: 'USDC', tokenAddress: contracts.weth, baseAssetAddress: contracts.usd, marketId: 1, address: contracts.wethMarket, image: 'market-wethusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 },
    ];
    localStorage.setItem('markets', JSON.stringify(markets));
    localStorage.setItem('lastMarket', 1);
    localStorage.setItem('prices', '{}');
    await fetch(`${api}airdrop?address=${wallet1.address}`).then(response => response.json()).then((responseJSON) => {
        if (responseJSON.success) {
            welcomeScreen();
        } else {
            console.log('Unable to claim airdrop');
        }
    });
}

const welcomeScreen = () => {
    document.getElementById('welcome').style.display = 'flex';
    document.getElementById('button-welcome-continue').onclick = () => {
        document.getElementById('welcome').style.display = 'none';
        loadWallets();
    }
}

const loadWallet = async () => {
    const wallets = JSON.parse(localStorage.wallets);
    const connectedWallet = localStorage.connectedWallet || 0;
    let virtualWallet;
    if (wallets[connectedWallet].type == 'browser') {
        provider = new ethers.BrowserProvider(window.ethereum)
        virtualWallet = await provider.getSigner();
    } else {
        const loadWallet = new ethers.Wallet(wallets[connectedWallet].privateKey);
        virtualWallet = loadWallet.connect(provider);
    }
    virtualWallet.name = wallets[connectedWallet].name || 'Unknown Wallet';
    virtualWallet.type = wallets[connectedWallet].type || 'virtual';
    return virtualWallet;
}

const connectWallet = async () => {
    provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    if (network.chainId !== 421613n) alert('Please set your network to Arbitrum Goerli Testnet or visit chainlist.org');
    const wallets = JSON.parse(localStorage.wallets);
    window.ethereum.on('accountsChanged', () => { connectWallet() });
    window.ethereum.on('network', () => { connectWallet() });
    let walletExists = false;
    for (let i = 0; i < wallets.length; i++)
        if (wallets[i].address == signer.address) walletExists = i;
    if (walletExists === false) {
        wallets.push({ name: 'Connected Wallet', privateKey: 'UNKNOWN CHECK BROWSER WALLET', address: signer.address, type: 'browser' })
        localStorage.setItem('wallets', JSON.stringify(wallets));
        localStorage.setItem('connectedWallet',wallets.length-1);
    } else {
        localStorage.setItem('connectedWallet',walletExists);
    }
    loadWallets();
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
    "function odexs(uint) view returns (address marketAddress, address deployer, address token, address baseAsset, uint marketId, uint deployedTimestamp, uint minOrder, uint tickRounding, uint multiplier, uint buyVolume, uint sellVolume, uint baseAssetTotalVolume)",
];

const odexFactoryAbi = [
    "function deploy(address _token, address _baseAsset, uint _minOrder, uint _tickRounding) public returns (address)"
];

const odexMarketsAbi = [
    "function tvl() view returns (uint)",
    "function midPrice() view returns (uint)",
    "function orderbook() view returns (uint[100] memory, uint[100] memory, address[100] memory, uint[100] memory, uint[100] memory, address[100] memory)",
    "function limitOrderBuy(uint _amount, uint _price) returns (uint)",
    "function limitOrderSell(uint _amount, uint _price) returns (uint)",
    "function cancelAllOrders()",
    "function cancelBid(uint _i)",
    "function cancelAsk(uint _i)",
    "event Bid(uint amount, uint price, address trader, uint index)",
    "event Ask(uint amount, uint price, address trader, uint index)",
    "event CancelBid(uint amount, uint price, address trader, uint index)",
    "event CancelAsk(uint amount, uint price, address trader, uint index)",
    "event Sell(uint amount, uint price, address trader, address filler, uint index)",
    "event Buy(uint amount, uint price, address trader, address filler, uint index)",

];

const balanceLookup = async (assetSymbol) => {
    const virtualWallet = await loadWallet();
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
        const virtualWallet = await loadWallet();
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
        const amount = ethers.parseUnits(rawAmount, asset.decimals);
        if (!withdrawalAddress || rawAmount <= 0) {
            alert('Address or amount incorrectly formatted');
            loadWallets();
            return false;
        }
        try {
            const virtualWallet = await loadWallet();
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
    const virtualWallet = await loadWallet();
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
    const virtualWallet = await loadWallet();
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

const refreshWallets = async () => {
    const virtualWallet = await loadWallet();
    try {
        const balanceWei = await provider.getBalance(virtualWallet.address);
        const balanceEther = ethers.formatEther(balanceWei);
        document.getElementById('wallet-ether').innerHTML = `${balanceEther.substr(0,8)}<span class="text-small"> ETH</span>`;
    } catch (e) {
        console.log('app.js e213 getBalance failed',e);
    }
    const walletValue = await getWalletValue(virtualWallet.address);
    if (!document.getElementById('wallet-value')) return false;
    document.getElementById('wallet-value').innerHTML = formatUSD(walletValue);
    await fetch('./components/wallet-asset.html').then(response => response.text()).then(async (responseText) => {
        let aHTML = '';
        const assets = JSON.parse(localStorage.assets);
        let assetId = 0;
        for (const asset of assets) {
            let assetImage = `<img class="asset-icon" src="./images/asset-misc.png" />`;
            if (asset.image) assetImage = `<img class="asset-icon" src="./images/${asset.image}" />`;
            const price = await priceLookup(asset.symbol);
            const divPrice = BigInt(price) / 1000000n;
            const formattedPrice =  formatUSD(divPrice);
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
                    .replace('<!-- wallet-value -->', formatUSD(dWalletValue));
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

const loadWallets = async () => {
    document.querySelector('.load-markets .footer-icon').setAttribute("src", './images/icon-markets.png');
    document.querySelector('.load-wallets .footer-icon').setAttribute("src", './images/icon-wallets-selected.png');
    document.querySelector('.load-trade .footer-icon').setAttribute("src", './images/icon-trade.png');
    await fetch('./wallets.html').then(response => response.text()).then((responseText) => {
        document.getElementById('content').innerHTML = responseText;
    });
    document.getElementById('top-right').innerHTML = socials;
    document.getElementById('connect-wallet-link').onclick = () => connectWallet();
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
    const virtualWallet = await loadWallet();
    if (virtualWallet.type == 'browser') document.getElementById('connect-wallet-link').innerHTML = `<div class="blue text-small">${virtualWallet.address.substr(0,12)}...</div>`;
    document.getElementById('wallet-address').innerHTML = virtualWallet.address;
    document.getElementById('deposit-address').innerHTML = virtualWallet.address;
    document.getElementById('deposit-qr').innerHTML = `<img src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${virtualWallet.address}&choe=UTF-8" class="qr-code responsive-image" />`;
    document.getElementById('wallet-name').innerHTML = virtualWallet.name;
    refreshWallets();
    setTimeout(() => {
        if (document.getElementById('wallet-name')) refreshWallets();
    }, 60000);
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
            const formattedTVL = formatUSD(divTVL);
            document.getElementById('trade-liquidity').innerHTML = formattedTVL;
        } catch (e) {
            console.log('app.js e413 tvl failed');
        }
        const price = await priceLookup(market.token);
        const divPrice = BigInt(price) / 1000000n;
        const formattedPrice = formatUSD(divPrice);
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
    document.getElementById('orderbook-link').onclick = displayOrderBook;
    document.getElementById('orders-link').onclick = displayOrders;
    document.getElementById('trades-link').onclick = displayTrades;
    document.getElementById('activity-link').onclick = displayActivity;
    document.getElementById('base-range').addEventListener("input", (e) => {
        document.getElementById('base-amount').innerHTML = e.target.value.toString().substr(0,8);
    });
    document.getElementById('token-range').addEventListener("input", (e) => {
        document.getElementById('token-amount').innerHTML = e.target.value.toString().substr(0,8);
    });
    document.getElementById('buy-button').onclick = () => {
        localStorage.setItem('order',JSON.stringify({...market, type: 'BUY', amount: document.getElementById('base-amount').innerHTML}));
        loadOrder();
    }
    document.getElementById('sell-button').onclick = () => {
        localStorage.setItem('order',JSON.stringify({...market, type: 'SELL', amount: document.getElementById('token-amount').innerHTML}));
        loadOrder();
    }
    displayOrderBook();
    checkApprovals();

    let tradingViewRef = false;
    const knownMarkets = [
        ['BTC','USD', 'COINBASE:BTCUSD'],
        ['ETH','USD', 'COINBASE:ETHUSD'],
    ];
    for (const km of knownMarkets)
        if (market.token.includes(km[0]) && market.baseAsset.includes(km[1])) tradingViewRef = km[2];
    if (tradingViewRef) {
        new TradingView.widget({
            "autosize": true,
            "symbol": tradingViewRef,
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
    } else {
        document.getElementById('tradingview-chart').innerHTML = '<div class="text-small faded">NO TRADINGVIEW CHART AVAILABLE FOR THIS ASSET AT THIS TIME</div>';
    }

}

const displayOrderBook = async () => {
    document.querySelectorAll('.ob-link').forEach(a => a.classList.remove('blue'));
    document.getElementById('orderbook-link').classList.add('blue');
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    if (!document.getElementById(`bid-amount-0`)) {
        const response = await fetch('./components/orderbook.html');
        const responseText = await response.text();
        document.getElementById('orderbook-container').innerHTML = responseText;
    }
    const ob = await refreshOrderBook();
    for (let i = 0; i < 6; i++) {
        let el, value;
        el = document.getElementById(`bid-amount-${i}`);
        value = ethers.formatUnits(ob.groupedBids[i][0].toString(), market.baseAssetDecimals).substr(0,6);
        const flashElements = [];
        if (el.innerHTML !== '' && el.innerHTML !== value) flashElements.push(el);
        el.innerHTML = value
        el = document.getElementById(`bid-price-${i}`);
        value = ethers.formatUnits(ob.groupedBids[i][1].toString(), market.baseAssetDecimals);
        if (el.innerHTML !== '' && el.innerHTML !== value) flashElements.push(el);
        el.innerHTML = value
        el = document.getElementById(`ask-amount-${i}`);
        value = ethers.formatUnits(ob.groupedAsks[i][0].toString(), market.tokenDecimals).substr(0,6);
        if (el.innerHTML !== '' && el.innerHTML !== value) flashElements.push(el);
        el.innerHTML = value
        el = document.getElementById(`ask-price-${i}`);
        value = ethers.formatUnits(ob.groupedAsks[i][1].toString(), market.baseAssetDecimals);
        if (el.innerHTML !== '' && el.innerHTML !== value) flashElements.push(el);
        el.innerHTML = value
        for(const flashElement of flashElements) {
            flashElement.classList.add('blue-bkg');
            setTimeout((fid) => { document.getElementById(fid).classList.remove('blue-bkg'); },200, flashElement.id);
            await new Promise(r => setTimeout(r, 50));
        }
    }
    setTimeout(() => {
        if (document.getElementById('orderbook-link') && document.getElementById('orderbook-link').classList.contains('blue'))
            displayOrderBook();
    }, refreshRate);
}

const displayOrders = async () => {
    document.querySelectorAll('.ob-link').forEach(a => a.classList.remove('blue'));
    document.getElementById('orders-link').classList.add('blue');
    const virtualWallet = await loadWallet();
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    const contract = new ethers.Contract(market.address, odexMarketsAbi, provider);
    const ob = await contract.orderbook();
    let oHTML = `<table class="orderbook"><tbody><tr class="faded"><td>SIDE</td><td>PRICE</td><td>AMOUNT</td><td>CANCEL</tr>`;
    for (let i = 0; i < 100; i++) {
        if (ob[2][i] == virtualWallet.address)
            oHTML += `<tr><td class="green">BUY</td><td>${ethers.formatUnits(ob[1][i].toString(), market.baseAssetDecimals)}</td><td>${ethers.formatUnits(ob[1][i].toString(), market.baseAssetDecimals).substr(0,6)}</td><td><button class="cancel-order button-small" data-bidask="bid" data-index="${i}">X</button></tr>`;
        if (ob[5][i] == virtualWallet.address)
            oHTML += `<tr><td class="red">SELL</td><td>${ethers.formatUnits(ob[4][i].toString(), market.baseAssetDecimals)}</td><td>${ethers.formatUnits(ob[3][i].toString(), market.baseAssetDecimals).substr(0,6)}</td><td><button class="cancel-order button-small" data-bidask="ask" data-index="${i}">X</button></tr>`;
    }
    oHTML += `<tr><td></td><td></td><td></td><td><button id="cancel-all" class="button-small">ALL</button></td></tr></tbody></table>`
    document.getElementById('orderbook-container').innerHTML = oHTML;
    document.querySelectorAll('.cancel-order').forEach(a => a.addEventListener('click', async (e) => {
        e.target.innerHTML = '...';
        const orderbookIndex = e.target.getAttribute("data-index");
        const bidAsk = e.target.getAttribute("data-bidask");
        const virtualWallet = await loadWallet();
        const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
        const contract = new ethers.Contract(market.address, odexMarketsAbi, virtualWallet);
        if (bidAsk == 'bid') {
            const tx = await contract.cancelBid(orderbookIndex);
            await tx.wait();
        } else if (bidAsk == 'ask') {
            const tx = await contract.cancelAsk(orderbookIndex);
            await tx.wait();
        }
        displayOrders();
    }));
    document.getElementById('cancel-all').onclick = async () => {
        document.getElementById('cancel-all').innerHTML = '...';
        const virtualWallet = await loadWallet();
        const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
        const contract = new ethers.Contract(market.address, odexMarketsAbi, virtualWallet);
        const tx = await contract.cancelAllOrders();
        await tx.wait();
        displayOrders();
        document.getElementById('cancel-all').innerHTML = 'ALL';
    }
}

const displayTrades = async () => {
    document.querySelectorAll('.ob-link').forEach(a => a.classList.remove('blue'));
    document.getElementById('trades-link').classList.add('blue');
    document.getElementById('orderbook-container').innerHTML = '<div class="text-left text-small faded" id="display-trades"><span class="blue">&gt;</span> Listening...<br></div>';
    const virtualWallet = await loadWallet();
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    const contract = new ethers.Contract(market.address, odexMarketsAbi, virtualWallet);
    contract.on('Buy', (amount, price, trader, filler, index) => {
        if (!document.getElementById('display-trades')) contract.removeAllListeners('Buy');
        const tHTML = `<span class="blue">&gt;</span> <span class="green">BUY</span> <span class="light">${ethers.formatUnits(amount.toString(), market.tokenDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a> <span class="faded">&gt;</span> <a href="https://goerli.etherscan.io/address/${filler}" target="_blank">${filler.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-trades').innerHTML;
        document.getElementById('display-trades').innerHTML = tHTML + ocHTML;
    });
    contract.on('Sell', (amount, price, trader, filler, index) => {
        if (!document.getElementById('display-trades')) contract.removeAllListeners('Sell');
        const tHTML = `<span class="blue">&gt;</span> <span class="red">SELL</span> <span class="light">${ethers.formatUnits(amount.toString(), market.baseAssetDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a> <span class="faded">&lt;</span> <a href="https://goerli.etherscan.io/address/${filler}" target="_blank">${filler.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-trades').innerHTML;
        document.getElementById('display-trades').innerHTML = tHTML + ocHTML;
    });
}

const displayActivity = async () => {
    document.querySelectorAll('.ob-link').forEach(a => a.classList.remove('blue'));
    document.getElementById('activity-link').classList.add('blue');
    document.getElementById('orderbook-container').innerHTML = '<div class="text-left text-small faded" id="display-activity"><span class="blue">&gt;</span> Listening...<br></div>';
    const virtualWallet = await loadWallet();
    const market = JSON.parse(localStorage.markets)[localStorage.lastMarket];
    const contract = new ethers.Contract(market.address, odexMarketsAbi, virtualWallet);
    contract.on('Buy', (amount, price, trader, filler, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('Buy');
        const tHTML = `<span class="blue">&gt;</span> <span class="green">BUY</span> <span class="light">${ethers.formatUnits(amount.toString(), market.tokenDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a> <span class="faded">&gt;</span> <a href="https://goerli.etherscan.io/address/${filler}" target="_blank">${filler.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
    });
    contract.on('Sell', (amount, price, trader, filler, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('Sell');
        const tHTML = `<span class="blue">&gt;</span> <span class="red">SELL</span> <span class="light">${ethers.formatUnits(amount.toString(), market.baseAssetDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a> <span class="faded">&lt;</span> <a href="https://goerli.etherscan.io/address/${filler}" target="_blank">${filler.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
    });   
    contract.on('Bid', (amount, price, trader, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('Bid');
        const tHTML = `<span class="blue">&gt;</span> <span class="blue">BID</span> <span class="light">${ethers.formatUnits(amount.toString(), market.baseAssetDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
    });
    contract.on('Ask', (amount, price, trader, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('Ask');
        const tHTML = `<span class="blue">&gt;</span> <span class="blue">ASK</span> <span class="light">${ethers.formatUnits(amount.toString(), market.tokenDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
    });
    contract.on('CancelBid', (amount, price, trader, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('CancelBid');
        const tHTML = `<span class="blue">&gt;</span> <span class="grey">CANCEL BID</span> <span class="light">${ethers.formatUnits(amount.toString(), market.baseAssetDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
    });
    contract.on('CancelAsk', (amount, price, trader, index) => {
        if (!document.getElementById('display-activity')) contract.removeAllListeners('CancelAsk');
        const tHTML = `<span class="blue">&gt;</span> <span class="grey">CANCEL ASK</span> <span class="light">${ethers.formatUnits(amount.toString(), market.tokenDecimals)}</span> <span class="orange">${ethers.formatUnits(price.toString(), market.baseAssetDecimals)}</span> <a href="https://goerli.etherscan.io/address/${trader}" target="_blank">${trader.substr(0,9)}...</a><br>`;
        const ocHTML = document.getElementById('display-activity').innerHTML;
        document.getElementById('display-activity').innerHTML = tHTML + ocHTML;
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
        document.getElementById('amount-in').innerHTML = `${order.amount.substr(0,12)}<span class="text-small"> ${order.baseAsset}</span>`;
        const amountOut = ethers.parseUnits(order.amount.toString(), order.baseAssetDecimals) * ethers.parseUnits('1',order.tokenDecimals) / order.price;
        let afterFees = amountOut;
        if (priceRange.value > 5) afterFees = afterFees * 999n / 1000n;
        document.getElementById('amount-out').innerHTML = `${ethers.formatUnits(amountOut, order.tokenDecimals).toString().substr(0,12)}<span class="text-small"> ${order.token}</span>`;
        document.getElementById('after-fees').innerHTML = `${ethers.formatUnits(afterFees, order.tokenDecimals).toString().substr(0,12)}`;
        order.amountString = ethers.parseUnits(order.amount, order.baseAssetDecimals).toString();
    } else if (order.type == 'SELL') {
        if (priceRange.value > 9) fill = `<span class="red">0%</span>`;
        if (priceRange.value < 6) fill = `<span class="green">100%</span>`;
        document.getElementById('amount-in').innerHTML = `${order.amount.substr(0,12)}<span class="text-small"> ${order.token}</span>`;
        const amountOut = ethers.parseUnits(order.amount.toString(), order.tokenDecimals) * order.price / ethers.parseUnits('1',order.tokenDecimals);
        let afterFees = amountOut;
        if (priceRange.value > 5) afterFees = afterFees * 999n / 1000n;
        document.getElementById('amount-out').innerHTML = `${ethers.formatUnits(amountOut, order.baseAssetDecimals).toString().substr(0,12)}<span class="text-small"> ${order.baseAsset}</span>`;
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
    const virtualWallet = await loadWallet();
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
    const virtualWallet = await loadWallet();
    const odexMarket = new ethers.Contract(order.address, odexMarketsAbi, virtualWallet);
    order.priceString = ethers.parseUnits(document.getElementById('price-confirm').innerHTML, order.baseAssetDecimals);
    if (order.type == 'BUY') {  
        const tx1 = await odexMarket.limitOrderBuy(order.amountString, order.priceString);
        await tx1.wait();
        prompt('BUY Confirmed! TX Hash:', tx1.hash);
    } else if (order.type == 'SELL') {
        const tx2 = await odexMarket.limitOrderSell(order.amountString, order.priceString);
        await  tx2.wait();
        prompt('SELL Confirmed! TX Hash:', tx2.hash);
    }
    loadTrade();
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
    const virtualWallet = await loadWallet();
    document.getElementById('order-wallet-name').innerHTML = virtualWallet.name;
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
    //localStorage.setItem('order',JSON.stringify({ type: 'BUY', amount: 500, token: 'wETH', baseAsset: 'USDC', marketId: 1, address: contracts.wethMarket, image: 'market-wethusdc.png', tokenDecimals: 18, baseAssetDecimals: 6 }));
    //loadTrade()
}

const setupIndex = async () => {
    document.getElementById('docs-button').onclick = () => {
        window.open('https://odexfi.gitbook.io/docs/');
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
        document.getElementById('index-tvl').innerHTML = formatUSD(Number(ethers.formatUnits(tvl, 6)));
        const volume = await contract.volume();
        document.getElementById('index-volume').innerHTML = formatUSD(Number(ethers.formatUnits(volume, 6)));
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




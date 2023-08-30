# Solidity API

## OdexFactory

### odex

```solidity
address odex
```

### constructor

```solidity
constructor(address _odex) public
```

### deploy

```solidity
function deploy(address _token, address _baseAsset, uint256 _minOrder, uint256 _tickRounding) public returns (address)
```

deploys a new market and order book for a token/baseAsset pair

_only OdexFactory can deploy contracts because of the callback to Odex.sol_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | ERC20 token address to be traded |
| _baseAsset | address | ERC20 baseAsset to be traded, usually WETH or Stablecoin |
| _minOrder | uint256 | minimum order value of baseAsset for an order to be accepted |
| _tickRounding | uint256 | reduces tick size 1e5, on a six decimal stable coin = $0.1 ticks |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | odexMarket contract address of newly deployed Odex market |

## IERC20D

A decentralized exchange built around a open limit order book

     _/_/_/_  /_/_/_/   /_/_/_/_/ /_/     /_/
   /_/   /_/ /_/   /_/ /_/         /_/ /_/
  /_/   /_/ /_/   /_/ /_/_/_/       /_/ 
 /_/   /_/ /_/   /_/ /_/         /_/ /_/
 /_/_/_/  /_/_/_/   /_/_/_/_/ /_/      /_/
      Open Decentralized Exchange
           https://odex.fi

### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

## IOdex

### buy

```solidity
function buy(uint256 _marketId, address _baseAsset, address _token, address _maker, address _taker, uint256 _amount, uint256 _fee, uint256 _price) external
```

### sell

```solidity
function sell(uint256 _marketId, address _baseAsset, address _token, address _maker, address _taker, uint256 _amount, uint256 _fee, uint256 _price) external
```

### odexCount

```solidity
function odexCount() external view returns (uint256)
```

### newMarket

```solidity
function newMarket(address _token, address _baseAsset, uint256 _minOrder, uint256 _tickRounding, uint256 _multiplier, address _marketAddress, address _deployer) external
```

## OdexMarket

### marketId

```solidity
uint256 marketId
```

### odex

```solidity
address odex
```

### deployer

```solidity
address deployer
```

### token

```solidity
address token
```

### baseAsset

```solidity
address baseAsset
```

### multiplier

```solidity
uint256 multiplier
```

### minOrder

```solidity
uint256 minOrder
```

### tickRounding

```solidity
uint256 tickRounding
```

### Order

```solidity
struct Order {
  address trader;
  uint256 amount;
  uint256 price;
}
```

### bids

```solidity
struct OdexMarket.Order[100] bids
```

### asks

```solidity
struct OdexMarket.Order[100] asks
```

### Bid

```solidity
event Bid(uint256 amount, uint256 price, address trader, uint256 index)
```

### Ask

```solidity
event Ask(uint256 amount, uint256 price, address trader, uint256 index)
```

### CancelBid

```solidity
event CancelBid(uint256 amount, uint256 price, address trader, uint256 index)
```

### CancelAsk

```solidity
event CancelAsk(uint256 amount, uint256 price, address trader, uint256 index)
```

### Sell

```solidity
event Sell(uint256 amount, uint256 price, address trader, address filler, uint256 index)
```

### Buy

```solidity
event Buy(uint256 amount, uint256 price, address trader, address filler, uint256 index)
```

### constructor

```solidity
constructor(uint256 _marketId, address _odex, address _deployer, address _token, address _baseAsset, uint256 _minOrder, uint256 _tickRounding, uint256 _multiplier) public
```

runs once when first deploy to set market parameters

_tokenDecimals used to calculate tokensToBaseAsset and baseAssetToTokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _marketId | uint256 | array index in Odex |
| _odex | address | address of the Odex.sol contract |
| _deployer | address | address of the pool deployer that called OdexFactory.deploy() |
| _token | address | ERC20 token address to be traded |
| _baseAsset | address | ERC20 baseAsset to be traded, usually WETH or Stablecoin |
| _minOrder | uint256 | minimum order value of baseAsset for an order to be accepted |
| _tickRounding | uint256 | reduces tick size 1e5, on a six decimal stable coin = $0.1 ticks |
| _multiplier | uint256 | used for calculating token <> baseAsset conversions = 10 ** tokenDecimals; |

### tokensToBaseAsset

```solidity
function tokensToBaseAsset(uint256 _amount, uint256 _price) public view returns (uint256)
```

Converts token value to the base asset value

_Price is lowest denomination of baseAsset per whole token 2000e6 for weth/usdc
tokensToBaseAsset 2e18 AmountIn * 2000e6 price / 1e18 tokenDecimals = 4000e6 baseAsset Out
baseAssetToTokens = 4000e6 AmountIn * 1e18 tokenDecimals / 2000e6 price = 2e18 tokens out
5000000 * 1e18 / 2001000000_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | The number of tokens |
| _price | uint256 | The price of each token |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The equivalent value of the tokens in the base asset |

### baseAssetToTokens

```solidity
function baseAssetToTokens(uint256 _amount, uint256 _price) public view returns (uint256)
```

Converts base asset value to the token value

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | The amount of base asset |
| _price | uint256 | The price of each token |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The equivalent value of base asset in tokens |

### lowestBid

```solidity
function lowestBid() public view returns (uint256, uint256, address, uint256)
```

Finds the lowest bid in the order book

_ignores empty entries, use worseBid to find next slot_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The lowest bid amount, price, trader address, and order index in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### highestBid

```solidity
function highestBid() public view returns (uint256, uint256, address, uint256)
```

Finds the highest bid in the order book

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The highest bid amount, price, trader address, and order index in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### lowestAsk

```solidity
function lowestAsk() public view returns (uint256, uint256, address, uint256)
```

Finds the lowest ask in the order book

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The lowest ask amount, price, trader address, and order index in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### highestAsk

```solidity
function highestAsk() public view returns (uint256, uint256, address, uint256)
```

Finds the highest ask in the order book

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The highest ask amount, price, trader address, and order index in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### worseBid

```solidity
function worseBid() public view returns (uint256, uint256, address, uint256)
```

Finds the lowest bid in the order book including any empty slots

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount, price, trader address, and order index of the worst bid in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### worseAsk

```solidity
function worseAsk() public view returns (uint256, uint256, address, uint256)
```

Finds the worst ask in the order book including any empty slots

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount, price, trader address, and order index of the worst ask in the order book |
| [1] | uint256 |  |
| [2] | address |  |
| [3] | uint256 |  |

### midPrice

```solidity
function midPrice() public view returns (uint256)
```

Calculates the mid price of the order book as average of the highest bid and lowest ask

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated mid price |

### bidLiquidity

```solidity
function bidLiquidity() public view returns (uint256, uint256, uint256)
```

Calculates the bid liquidity and the lowest and highest bid prices

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total bid liquidity, the lowest and the highest bid prices |
| [1] | uint256 |  |
| [2] | uint256 |  |

### askLiquidity

```solidity
function askLiquidity() public view returns (uint256, uint256, uint256)
```

Calculates the ask liquidity and the lowest and highest ask prices

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total ask liquidity, the lowest and the highest ask prices |
| [1] | uint256 |  |
| [2] | uint256 |  |

### tvl

```solidity
function tvl() external view returns (uint256)
```

Calculates the total value locked (TVL) in the contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated TVL |

### orderbook

```solidity
function orderbook() public view returns (uint256[100], uint256[100], address[100], uint256[100], uint256[100], address[100])
```

Returns the full order book

_tested this without structs and could potentially decrease computation time 10% by removing for loop_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[100] | bidsAmount The arrays of bid amounts |
| [1] | uint256[100] | bidsPrice The arrays of bid prices |
| [2] | address[100] | bidsTrader The arrays of bid traders |
| [3] | uint256[100] | asksAmount The arrays of ask amounts |
| [4] | uint256[100] | asksPrice The arrays of ask prices |
| [5] | address[100] | asksTrader The arrays of ask traders |

### placeBid

```solidity
function placeBid(uint256 _amount, uint256 _price) internal
```

place a bid limit order into the order book

_designed to fail silently to prevent reverted transactions when placing multitrade_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | bid amount of base asset |
| _price | uint256 | price including multiplier |

### placeAsk

```solidity
function placeAsk(uint256 _amount, uint256 _price) internal
```

place a ask limit order into the order book

_designed to fail silently to prevent reverted transactions when placing multitrade_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | ask amount of token |
| _price | uint256 | price including multiplier |

### fillBid

```solidity
function fillBid(uint256 _i, uint256 _amount) internal returns (uint256)
```

fill a bid up to the amount requested

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _i | uint256 | index of the order in bids array |
| _amount | uint256 | is base asset amount |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | fillAmount the amount filled in base assets |

### fillAsk

```solidity
function fillAsk(uint256 _i, uint256 _amount) internal returns (uint256)
```

fill a ask up to the amount requested

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _i | uint256 | index of the order in asks array |
| _amount | uint256 | is token amount |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | fillAmount is the filled amount in tokens |

### limitOrderSell

```solidity
function limitOrderSell(uint256 _amount, uint256 _price) public returns (uint256)
```

place an order to sell an amount of the token down to a set price

_this will attempt to fill the order at makers bid prices, if no matches
in the order book then a new ask order will be created at _price_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | is token amount |
| _price | uint256 | price including multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | filled amount in tokens that got filled |

### limitOrderBuy

```solidity
function limitOrderBuy(uint256 _amount, uint256 _price) public returns (uint256)
```

place an order to buy an amount of the token up to a set price

_this will attempt to fill the order at makers ask prices, if no matches
in the order book then a new bid order will be created at _price_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | is base asset amount |
| _price | uint256 | price including multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | filled amount in base asset that got filled |

### multiTrade

```solidity
function multiTrade(uint256[] _bidAmounts, uint256[] _bidPrices, uint256[] _askAmounts, uint256[] _askPrices) external
```

sends up to 10 bids & 10 asks trades in a single tx, useful for market makers

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _bidAmounts | uint256[] | array of bid amounts, amount is baseAsset, corresponds to same index in _bidPrices |
| _bidPrices | uint256[] | array of unique bid prices including multiplier i.e. $1 = 1e6 if six decimal stablecoin transaction will fail if two bid prices are the same |
| _askAmounts | uint256[] | array of askAmounts, amount is token,  corresponds to same index in _askPrices |
| _askPrices | uint256[] | array of unique ask prices including multiplier i.e. $1 = 1e6 if six decimal stablecoin transaction will fail if two ask prices are the same |

### cancelBid

```solidity
function cancelBid(uint256 _i) public
```

cancels a single bid order

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _i | uint256 | index of the order in asks array |

### cancelAsk

```solidity
function cancelAsk(uint256 _i) public
```

cancels a single ask order

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _i | uint256 | index of the order in asks array |

### cancelOrders

```solidity
function cancelOrders(uint256[] _cBids, uint256[] _cAsks) external
```

cancels multiple orders in a single tx

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _cBids | uint256[] | array of the order indexes in bids |
| _cAsks | uint256[] | array of the order indexes in asks |

### cancelAllOrders

```solidity
function cancelAllOrders() external
```

panic and cancel all users orders

## Token

### constructor

```solidity
constructor(string _name, string _ticker) public
```

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

## USD

### constructor

```solidity
constructor() public
```

### decimals

```solidity
function decimals() public pure returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the default value returned by this function, unless
it's overridden.

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

## WETH

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 wad) public
```

## IERC20D

### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

## IOdexMarket

### tvl

```solidity
function tvl() external view returns (uint256)
```

## Odex

### ODeXs

```solidity
struct ODeXs {
  address marketAddress;
  address deployer;
  address token;
  address baseAsset;
  uint256 marketId;
  uint256 deployedTimestamp;
  uint256 minOrder;
  uint256 tickRounding;
  uint256 multiplier;
  uint256 buyVolume;
  uint256 sellVolume;
  uint256 baseAssetTotalVolume;
}
```

### odexs

```solidity
struct Odex.ODeXs[] odexs
```

### odexCount

```solidity
uint256 odexCount
```

### odexToken

```solidity
contract OdexToken odexToken
```

### odexFactory

```solidity
address odexFactory
```

### odexLookup

```solidity
mapping(address => uint256) odexLookup
```

### metadata

```solidity
mapping(address => string) metadata
```

### rewardsAssets

```solidity
mapping(address => uint256) rewardsAssets
```

### Sell

```solidity
event Sell(uint256 marketId, address baseAsset, address token, address maker, address taker, uint256 amount, uint256 fee, uint256 price)
```

### Buy

```solidity
event Buy(uint256 marketId, address baseAsset, address token, address maker, address taker, uint256 amount, uint256 fee, uint256 price)
```

### ODEXDeployed

```solidity
event ODEXDeployed(struct Odex.ODeXs odex)
```

### constructor

```solidity
constructor() public
```

### newMarket

```solidity
function newMarket(address _token, address _baseAsset, uint256 _minOrder, uint256 _tickRounding, uint256 _multiplier, address _marketAddress, address _deployer) external
```

called by OdexFactory.sol each time a new market is deployed

_only OdexFactory can deploy markets and the address is set on the first deployment_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | ERC20 token address to be traded |
| _baseAsset | address | ERC20 baseAsset to be traded, usually WETH or Stablecoin |
| _minOrder | uint256 | minimum order value of baseAsset for an order to be accepted |
| _tickRounding | uint256 | reduces tick size 1e5, on a six decimal stable coin = $0.1 ticks |
| _multiplier | uint256 | used for calculating token <> baseAsset conversions = 10 ** tokenDecimals; |
| _marketAddress | address | contract address of newly deployed Odex market |
| _deployer | address |  |

### tvl

```solidity
function tvl() external view returns (uint256 totalTVL)
```

reports total TVL across all markets

_will break as soon as baseAssets other than USD are added_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalTVL | uint256 | TVL in baseAsset, assumes all baseAssets the same value |

### volume

```solidity
function volume() external view returns (uint256 totalVolume)
```

reports total volume across all markets

_will break as soon as baseAssets other than USD are added_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalVolume | uint256 | in baseAsset, assumes all baseAssets the same value |

### claimTokens

```solidity
function claimTokens(address[] _tokens) external
```

allows contract owner to claim tokens sent to the contract address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokens | address[] | an array of ERC20 token addresses that are to be claimed |

### rewardsAsset

```solidity
function rewardsAsset(address _token, uint256 _rewards) external
```

allows contract owner to set the rewards per asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | the address of the asset |
| _rewards | uint256 | the amount of rewards per asset |

### update

```solidity
function update(string _update) external
```

allows each address to update their own metadata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _update | string | the new metadata string |

### incentive

```solidity
function incentive(address _asset, uint256 _fee, address _maker, address _taker) internal
```

calculates and dispenses incentive rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _asset | address | the address of the traded asset |
| _fee | uint256 | the transaction fee |
| _maker | address | the address of the maker |
| _taker | address | the address of the taker |

### buy

```solidity
function buy(uint256 _marketId, address _baseAsset, address _token, address _maker, address _taker, uint256 _amount, uint256 _fee, uint256 _price) external
```

registers a buy order from OdexMarket.sol and settles incentives

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _marketId | uint256 | the array index of the market in odexs |
| _baseAsset | address | the address of the base asset |
| _token | address | the address of the traded token |
| _maker | address | the address of the maker trader |
| _taker | address | the address of the taker trader |
| _amount | uint256 | the amount traded in tokens |
| _fee | uint256 | the transaction fee |
| _price | uint256 | the trading price |

### sell

```solidity
function sell(uint256 _marketId, address _baseAsset, address _token, address _maker, address _taker, uint256 _amount, uint256 _fee, uint256 _price) external
```

registers a sell order from OdexMarket.sol and settles incentives

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _marketId | uint256 | the array index of the market in odexs |
| _baseAsset | address | the address of the base asset |
| _token | address | the address of the traded token |
| _maker | address | the address of the maker trader |
| _taker | address | the address of the taker trader |
| _amount | uint256 | the amount traded in baseAssets |
| _fee | uint256 | the transaction fee |
| _price | uint256 | the trading price |

## OdexToken

### deployedTimestamp

```solidity
uint256 deployedTimestamp
```

### communityMinted

```solidity
uint256 communityMinted
```

### partnerMinted

```solidity
uint256 partnerMinted
```

### liquidityMinted

```solidity
uint256 liquidityMinted
```

### teamMinted

```solidity
uint256 teamMinted
```

### saleMinted

```solidity
uint256 saleMinted
```

### startDate

```solidity
uint256 startDate
```

### endDate

```solidity
uint256 endDate
```

### startPricePerToken

```solidity
uint256 startPricePerToken
```

### endPricePerToken

```solidity
uint256 endPricePerToken
```

### tokenSaleLimit

```solidity
uint256 tokenSaleLimit
```

### tokenLive

```solidity
bool tokenLive
```

### CommunityMinted

```solidity
event CommunityMinted(address to, uint256 amount)
```

### PartnerMinted

```solidity
event PartnerMinted(address to, uint256 amount)
```

### LiquidityMinted

```solidity
event LiquidityMinted(address to, uint256 amount)
```

### TeamMinted

```solidity
event TeamMinted(address to, uint256 amount)
```

### PublicSale

```solidity
event PublicSale(address to, uint256 amount, uint256 ethContributed)
```

### constructor

```solidity
constructor(address _team) public
```

Sets the contract's name, ticker and current timestamp
 mints initial distribution including vested team tokens in contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _team | address | The address to send the team's initial token grant to |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal
```

Overridden function to ensure token transfers are enabled before transfer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address of sender |
| to | address | The address of receiver |
| amount | uint256 | The amount of tokens to be transferred |

### pricePerDay

```solidity
function pricePerDay(uint256 _day) public view returns (uint256)
```

Calculates the price for the given day

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _day | uint256 | The day for which price is to be determined |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | currentPrice The calculated price for the day |

### staggeredPrice

```solidity
function staggeredPrice() public view returns (uint256)
```

Get current staggered price

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | currentPrice Current staggered price |

### nextPriceUpdate

```solidity
function nextPriceUpdate() external view returns (uint256, uint256)
```

Provides time left in seconds for the next price update and the new price

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | secondsLeft The time left in seconds for the next price update |
| [1] | uint256 | nextPrice The price after next update |

### buyTokens

```solidity
function buyTokens() external payable
```

Allows external users to buy tokens by sending eth with transaction

### goLive

```solidity
function goLive() external
```

Allows the owner to make token live and reclaim unsold tokens

### unlockTeamTokens

```solidity
function unlockTeamTokens(address _to, uint256 _amount) public
```

Unlock team's tokens after a year has passed since deployment

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The address to send the unlocked team tokens to |
| _amount | uint256 | The number of tokens to mint |

### mintCommunity

```solidity
function mintCommunity(address _to, uint256 _amount) public
```

Mints tokens for community contributors

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The address to send newly minted community tokens to |
| _amount | uint256 | The number of tokens to mint |

### mintPartner

```solidity
function mintPartner(address _to, uint256 _amount) public
```

Mints tokens for partners

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The address to send newly minted partner tokens to |
| _amount | uint256 | The number of tokens to mint |

### mintLiquidity

```solidity
function mintLiquidity(address _to, uint256 _amount) public
```

Mints tokens for liquidity on CEX/DEX

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The address to send newly minted advisor tokens to |
| _amount | uint256 | The number of tokens to mint |


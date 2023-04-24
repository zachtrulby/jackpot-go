# jackpot-go
An exchange trading bot for demonstration purposes.

## Pseudocode

The bot will scrape the top 5 inclusive exchanges on [CoinMarketCap](https://coinmarketcap.com/rankings/exchanges).

From this data, it will build a dictionary with accumulators as values for the number of unique coins it finds in these data.

On every sixth day, it will utilize this list to make purchase orders which it will execute at market closing.

On the forteenth day, and every seven days thereafter, it will execute sell orders for coins which have 50% return from those coins purchased on day six. It will only sell the return (principle x return as %) every seventh day in cycle. It will repeat this every 6 days thereafter.

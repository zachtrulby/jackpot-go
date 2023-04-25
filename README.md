# jackpot-go
An exchange trading bot for demonstration purposes. I am taking on this project for learning the go language to work on other contributions with API/http requests on future endeavors.

## Pseudocode

The bot will scrape the top 5 inclusive exchanges on [CoinMarketCap](https://coinmarketcap.com/rankings/exchanges).

From this data, it will build a dictionary with accumulators as values for the number of unique coins it finds in these data.

On every sixth day, it will utilize this list to make purchase orders which it will execute at market closing. It will repeat this action every 7 days from this point thereafter.

On the forteenth day, and every seven days thereafter, it will execute sell orders for coins which have `> 20%` return from those coins purchased on day six. It will only sell the return profit (principle x return as decimal) every seventh day in cycle. It will repeat this every six days thereafter.

It will also have the capability to execute sell orders at any time assuming they've reached the conditional threshold of 20% or greater.

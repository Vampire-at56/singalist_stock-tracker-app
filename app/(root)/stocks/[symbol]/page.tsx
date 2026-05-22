import TradingViewWidget from "@/components/TrendingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
  BASELINE_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";

const TV_SCRIPT_BASE_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
  const { symbol } = await params;

  return (
    <div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-2">
      <section className="flex flex-col gap-8">
        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}symbol-info.js`}
          config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
          height={170}
          className="custom-chart"
        />

        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}advanced-chart.js`}
          config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
          height={600}
          className="custom-chart"
        />

        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}advanced-chart.js`}
          config={BASELINE_WIDGET_CONFIG(symbol)}
          height={600}
          className="custom-chart"
        />
      </section>

      <section className="flex flex-col gap-8">
        <WatchlistButton
          symbol={symbol.toUpperCase()}
          company={symbol.toUpperCase()}
          isInWatchlist={false}
        />

        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}technical-analysis.js`}
          config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
          height={400}
          className="custom-chart"
        />

        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}symbol-profile.js`}
          config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
          height={440}
          className="custom-chart"
        />

        <TradingViewWidget
          scriptUrl={`${TV_SCRIPT_BASE_URL}financials.js`}
          config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
          height={464}
          className="custom-chart"
        />
      </section>
    </div>
  );
};

export default StockDetails;


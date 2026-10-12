// The admin shows every amount in US dollars. Packages and payments are stored and
// charged in VND (PayOS); amounts are converted at the site's fixed rate, which the
// backend owns (USD_VND_RATE) and this module reads once at load.
import API_BASE from '../config/api';

let rate = 26000;   // VND per 1 USD — the backend default, replaced once the real one arrives

fetch(`${API_BASE}/customer/vip/currency`)
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => { if (d && Number(d.usd_vnd_rate) > 0) rate = Number(d.usd_vnd_rate); })
  .catch(() => {});

export const usdVndRate = () => rate;
export const vndToUsd = (vnd) => Math.round((Number(vnd || 0) / rate) * 100) / 100;
export const usdToVnd = (usd) => Math.round(Number(usd || 0) * rate);
export const formatUsd = (usd) =>
  `$${Number(usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// VND amount from the API → "$12.34"
export const vndAsUsd = (vnd) => formatUsd(vndToUsd(vnd));

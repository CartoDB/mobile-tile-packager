var port = 8787;
var mtp_host = process.env.MTP_HOST ? process.env.MTP_HOST : 'localhost';
var secrets = require('./secrets.json');
var api_key = secrets.api_key ? `api_key=${secrets.api_key}` : '';


module.exports = {
  report_log: false, //log output for each tile
  concurrency: 5,   //number of parallel tile downloads
  output: '/tmp',
  server_port: port,
  private: api_key,
  inst_url: `https://{username}.carto.com/api/v1/map/named/{template}?${api_key}`,
  map_url: `https://{username}.carto.com/api/v1/map?${api_key}`,
  tile_url: `https://{username}.carto.com/api/v1/map/{layergroupid}/{z}/{x}/{y}.mvt?${api_key}`,
  download_url: `http://${mtp_host}:${port}/api/v1/package/get/{username}/{id}`,
  sql_api_url: `http://{username}.carto.com/api/v2/sql?${api_key}&q={sql}&format=GeoJSON`,
  tippe: 'tippecanoe -o {mbtiles_file} --minimum-zoom={minzoom} --maximum-zoom={maxzoom} --layer=layer {geojson_file}',
  /* kue job manager settings */
  kue_redis_port: process.env.REDIS_PORT !== undefined ? parseInt(process.env.REDIS_PORT) : 6379,
  kue_redis_host: process.env.REDIS_HOST !== undefined ? process.env.REDIS_HOST : '127.0.0.1',
  kue_redis_prefix: 'q'
}

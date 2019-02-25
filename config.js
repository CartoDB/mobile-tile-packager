var port = 8787;

module.exports = {
  report_log: false, //log output for each tile
  concurrency: 5,   //number of parallel tile downloads
  output: '/tmp',
  server_port: port,
  inst_url: 'https://{username}.carto.com/api/v1/map/named/{template}',
  tile_url: 'https://{username}.carto.com/api/v1/map/{layergroupid}/{z}/{x}/{y}.mvt',
  download_url: 'http://' + (process.env.MTP_HOST !== undefined ? process.env.MTP_HOST : 'localhost') + ':' + port + '/api/v1/package/get/{username}/{id}',
  sql_api_url: 'http://{username}.carto.com/api/v2/sql?q={sql}&format=GeoJSON',
  tippe: 'tippecanoe -o {mbtiles_file} --minimum-zoom={minzoom} --maximum-zoom={maxzoom} --layer=layer {geojson_file}',
  /* kue job manager settings */
  kue_redis_port: process.env.REDIS_PORT !== undefined ? parseInt(process.env.REDIS_PORT) : 6379,
  kue_redis_host: process.env.REDIS_HOST !== undefined ? process.env.REDIS_HOST : '127.0.0.1',
  kue_redis_prefix: 'q'
}

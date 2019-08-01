[![Build Status](https://travis-ci.org/CartoDB/mobile-tile-packager.svg?branch=master)](https://travis-ci.org/CartoDB/mobile-tile-packager)

# CARTO vector-tile-packager

Creates vector tile mbtiles from CARTO Named Maps API of SQL API. The script is meant for your on-premises usage, even if it has http API. Result mbtiles can be used in CARTO Mobile SDK as offline vector tile data source. For this you need also styling, what you can take as CartoCSS directly from CARTO Builder (web interface).

It has two usage modes:

a) do **SQL query** to the dataset, convert result to mbtiles for given zoom range. Suitable for big datasets, for big areas, where number of tiles would be huge. Works for single layer map only. Typical SQL could be here just `SELECT * FROM your-table`, but you can add your custom filters to it.

b) **download all tiles** of given map from CARTO Maps API, scraping for given area and zoom range. Suitable for limited regions. Works for multi-layer maps.


### Requirements
- Mapbox tippecanoe installed on machine. (https://github.com/mapbox/tippecanoe)
- Redis service running in localhost
- node.js

### Install
```sh
  $ npm install
```

### API service
```sh
  $ node service.js
```

## Usage
### 1. Prepare data in CARTO:
1. Upload map data table.
2. Create map, define simple styling - colors etc. Complex styling (heatmaps, torque etc) probably does not work
3. Note map ID from URL, convert it to template ID, so e.g. `https://cartomobile-team.carto.com/u/nutiteq/builder/846ab11c-f385-11e6-9314-0ee66e2c9693` becomes *tpl_846ab11c_f385_11e6_9314_0ee66e2c9693*
3. If the map is private you must create environment ```"MTP_API_KEY"``` with a valid API key.

**NB! Does NOT work with private map or dataset**

### 2. Make requests - first to start process, and then to get .zip file:

A cURL POST request allows you to export the mbtiles, which you will have to poll with a GET command until the state is complete.
(NB! bounds must be separated by commas, in lon/lat order (e.g. ` "bounds": "-121.951997,37.322666,-121.937599,37.328007"`)

**Method 1 - Using Named Maps API**, do POST request:
```sh
  curl -H "Content-Type: application/json" -X POST -d '{"type": "tiles", "data": {"username": "{username}", "template":"{template}", "minzoom": 10, "maxzoom": 18, "bounds": "{bounds}"}}'
  http://{server}/api/v1/package_exports
```

**Method 2 - Using SQL API**, do POST request:
```sh
  curl -H "Content-Type: application/json" -X POST -d '{"type": "geojson", "data": {"username": "{username}", "template":"{template}", "sql": "{sql}", "minzoom": 10, "maxzoom": 18}}'
  http://{server}/api/v1/package_exports_by_sql
```

POST Request for either method will return job id:
```sh
  {"id":301,"created_at":"2016-12-16T10:30:23.076Z"}
```

To get a job status and download url, call GET request:
```sh
  http://{server}/api/v1/package_exports/{username}/{id}
```

Request will return job info with package download url:
```sh
  {"id":"xx","username":"kk","template":"tpl_444","started_at":"2016-12-16T09:20:25.459Z","duration":"00:00:10.9","download_url":"zz"}
```

### 3. use file in your app code:
1. unzip the result, get .mbtiles and .json
2. put .mbtiles into app code, or make app to download it
4. add data to map using MBTilesTileDataSource, use CartoCSSStyleSet as MBVectorTileDecoder. You can use CartoCSS from the map styling, see point 1.2 above.

## Test suite

Run only kue/redis related tests
```sh
  $ npm run test-kue
```

Run all tests
```sh
  $ npm test
```

## Docker
You can launch the API service having Docker as the only dependency by running:
```sh
  $ docker-compose up
```

## Postman collection
In the repository's root directory you can find a Postman collection for launching jobs and consulting their status.

## Other similar projects
* https://github.com/CartoDB/cartodb_mbtiles - same in Python, for raster tiles only
* https://github.com/mapbox/tippecanoe - converts geojson to mbtiles. Can be used on top of CartoDB SQL API or using ogr2ogr to convert from other formats.

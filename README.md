[![Build Status](https://travis-ci.org/CartoDB/mobile-tile-packager.svg?branch=master)](https://travis-ci.org/CartoDB/mobile-tile-packager)

# vector-tile-packager
Creates mbtiles from Named Maps API of SQL API

Requirements:
- Mapbox tippecanoe installed on machine. (https://github.com/mapbox/tippecanoe)
- Redis service running in localhost
- node.js

install:
```sh
  $ npm install
```


### Run API service:
```sh
  $ node service.js
```

## Usage
### 1. Prepare data in CARTO
1. Upload map data table, set privacy to public or shared by link
2. Create map, define simple styling - colors etc. Complex styling (heatmaps, torque etc) probably does not work
3. Note map ID from URL, convert it to template ID, so e.g. https://cartomobile-team.carto.com/u/nutiteq/builder/846ab11c-f385-11e6-9314-0ee66e2c9693 becomes tpl_846ab11c_f385_11e6_9314_0ee66e2c9693
3. Make map privacy to "shared by link" or "public"

**NB! Does NOT work with private map or dataset**

### 2. Make requests - first to start process, and then to get .zip file

A cURL POST request allows you to export the mbtiles, which you will have to poll with a GET command until the state is complete.
(NB! bounds must be separated by commas, in lon/lat order (e.g. ` "bounds": "-121.951997,37.322666,-121.937599,37.328007"`)

Using Named Maps API, call POST request:
```sh
  curl -H "Content-Type: application/json" -X POST -d '{"type": "tiles", "data": {"username": "{username}", "template":"{template}", "minzoom": 10, "maxzoom": 18, "bounds": "{bounds}"}}' 
  http://{server}/api/v1/package_exports
```

Using SQL API, call POST request:
```sh
  curl -H "Content-Type: application/json" -X POST -d '{"type": "geojson", "data": {"username": "{username}", "template":"{template}", "sql": "{sql}", "minzoom": 10, "maxzoom": 18}}' 
  http://{server}/api/v1/package_exports_by_sql
```

POST Request will return job id:
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
4. add map using MBTilesTileDataSource, use CartoCSSStyleSet as MBVectorTileDecoder

## Run test suite:

Run only kue/redis related tests
```sh
  $ npm run test-kue
```

Run all tests
```sh
  $ npm test
```


## Other similar projects
* https://github.com/CartoDB/cartodb_mbtiles - same in Python, for raster tiles only
* https://github.com/mapbox/tippecanoe - converts geojson to mbtiles. Can be used on top of CartoDB SQL API or using ogr2ogr to convert from other formats.


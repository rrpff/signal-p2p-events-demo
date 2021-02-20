rm public/assets/dist/bundle.js
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=. ./src/protos/*.proto
browserify src/index.ts -p [ tsify ] -o public/assets/dist/bundle.js

rm public/assets/dist/bundle.js
echo 'Cleaned...'
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=. ./src/protos/*.proto
echo 'Built proto typescript files...'
browserify src/index.ts -p [ tsify ] -o public/assets/dist/bundle.js
echo 'Built client...'

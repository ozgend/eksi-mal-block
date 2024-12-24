#! /bin/bash

echo "clean ./pack/"
rm -rf pack/ || true
mkdir pack/

echo "creating zip"
zip -r pack/malBlock.zip malBlock/ -x "*.pem" ".DS_Store"

echo "creating xpi"
cd malBlock && zip -r ../pack/malBlock.xpi * -x "*.pem" "*.DS_Store" && cd ..

echo "creating crx"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=malBlock --pack-extension-key=data/key.pem
mv malBlock.crx pack/malBlock.crx

echo "done"
ls ./pack/

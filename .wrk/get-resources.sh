#!/bin/bash
SCRIPT_PATH="${BASH_SOURCE[0]}";
if ([ -h "${SCRIPT_PATH}" ]) then
  while([ -h "${SCRIPT_PATH}" ]) do SCRIPT_PATH=`readlink "${SCRIPT_PATH}"`; done
fi
SCRIPT_PATH=`dirname ${SCRIPT_PATH}` 
echo ${SCRIPT_PATH}
#pushd . > /dev/null
#cd `dirname ${SCRIPT_PATH}` > /dev/null
#SCRIPT_PATH=`pwd`;
#popd  > /dev/null
#echo $SCRIPT_PATH
JS_PATH=$SCRIPT_PATH"/../js"
echo ${JS_PATH}
curl https://raw.githubusercontent.com/github/fetch/master/fetch.js -o ${JS_PATH}"/fetch.js"
curl https://raw.githubusercontent.com/nolimits4web/Framework7/master/dist/js/framework7.min.js -o ${JS_PATH}"/framework7.min.js"
curl https://raw.githubusercontent.com/nolimits4web/Framework7/master/dist/js/framework7.min.js.map -o ${JS_PATH}"/framework7.min.js.map"

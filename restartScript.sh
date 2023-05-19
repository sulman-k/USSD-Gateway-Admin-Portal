#!/bin/bash
#id=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select id from node_configuration order by id desc limit 1;")
id=$1
echo "$id"
DEST=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select ip from node_configuration where id = $id;")
DestPath=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select path from node_file_paths  where node_id = $id ;")

echo "$DEST"
ping -q -c1 ${DEST}
if [ $? -eq 0 ]
then
echo "${DEST} OK"
sleep 1
else



echo "${File} not OK"



fi
#done
#echo "WORKING on Restart Application "

Destdir=$DestPath/run
ssh $DEST "sh  $DestPath/run stop"
ssh $DEST "sh  $DestPath/run stop"
ssh $DEST "sh  $DestPath/run start"
ssh $DEST "sh  $DestPath/run start"



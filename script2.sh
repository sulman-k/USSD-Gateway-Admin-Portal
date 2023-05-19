#!/bin/bash
id=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select id from node_configuration order by id desc limit 1;")
DEST=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select ip from node_configuration where id = $id;")
DestPath=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select path from node_file_paths  where node_id = $id ;")
filename=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select file_name from node_file_paths  where node_id = $id;")
SrcPath=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select local_path from node_configuration where id = $id;")
echo "$DEST"
echo "$DestPath"
rm ./filename2.txt
rm ./destpath2.txt
echo "$filename" >> "./filename2.txt"
echo "$DestPath" >> "./destpath2.txt"
while read -u 10 p; do
        while read -u 10 q; do
        echo "/usr/bin/rsync -vv -u -rtld --rsh=ssh $SrcPath $DEST:$q/$p"
        /usr/bin/rsync -vv -u -rtld --rsh=ssh $SrcPath/$p $DEST:$q/$p
        done 10<destpath2.txt
done 10<filename2.txt
ping -q -c1 ${DEST}
if [ $? -eq 0 ]
then
#/usr/bin/rsync -vv -u -rtld --rsh=ssh --stats --progress $SrcPath root@$DEST:$DestPath



#/usr/bin/rsync -vv -u -rtld --rsh=ssh $DEST:$Path SrcPath
echo "${DEST} OK"
sleep 1
else



echo "${File} not OK"



fi
#done

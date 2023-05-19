#!/bin/bash
id=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select id from node_configuration order by id desc limit 1;")
DEST=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select ip from node_configuration where id = $id;")
DestPath=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select path from node_file_paths  where node_id = $id ;")
filename=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select file_name from node_file_paths  where node_id = $id;")
SrcPath=$(mysql -uroot -proot -N -hapidb1 -Dadmin_portal -e "select local_path from node_configuration where id = $id;")
echo "$DEST"
echo "$DestPath"
rm ./filename.txt
rm ./destpath.txt
echo "$filename" >> "./filename.txt"
echo "$DestPath" >> "./destpath.txt"
while read -u 10 p; do
	while read -u 10 q; do
	echo "/usr/bin/rsync -vv -u -rtld --rsh=ssh $DEST:$q/$p $SrcPath"
	/usr/bin/rsync -vv -u -rtld --rsh=ssh $DEST:$q/$p $SrcPath
	done 10<destpath.txt
done 10<filename.txt
ping -q -c1 ${DEST}
if [ $? -eq 0 ]
then
echo "${DEST} OK"
sleep 1
else

echo "${File} not OK"

fi
#done

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

echo "Execution Started on " `date`

year=`date +%Y`
month=`date +%m`
day=`date +%d`
hour=`date +%H`
minute=`date +%M`

currenttime=$year$month${day}_${hour}${minute}
dt=$year$month$day


echo "WORKING on  ${currenttime} DATA "

Destdir=/home/archiveconf/${dt}/config_${currenttime}
ssh $DEST "mkdir -p  \"$Destdir\""
echo "/usr/bin/rsync -a $SrcPath/$p $DEST:$Destdir"
/usr/bin/rsync -a $SrcPath/$p  $DEST:$Destdir

echo "####################################################################################################"
echo "####################################################################################################"

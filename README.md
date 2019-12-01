# LiteStorage
Javascript 轻量浏览器键值对永久存储模块

# 作用
永久保存键值对数据在浏览器中。

# 现有功能：
setItem getItem removeItem iterate clear
按照indexedDB、WebSQL、localStorage的顺序自动降级，兼容了所有主流的浏览器。
降级判断更加严谨，增加了尝试修改的机制，修改失败自动降级，以应对极端浏览器情况。
支持存储JSON对象，不支持不可序列化的数据。

# 使用方法：

db.setItem("key","value",function(){
    //设置键值成功
    db.getItem("key",function(value){
        //读取键值成功
        console.log(value);
        db.iterate(function(key,value){
            //遍历键值
            console.log(key,value);
        },function(value){
            //遍历结束返回
            db.removeItem("key",function(){
                //删除键值成功
                db.clear(function(){
                    //清空所有键值对成功！
                    console.log("测试成功！");
                });
            });
        });
    });
});

性能：比开源库localforage性能提高至少2%，文件大小大大缩减。

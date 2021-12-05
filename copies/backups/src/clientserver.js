var Exported = {
    httpGet: function(theUrl, callback)
    {
        if (window.XMLHttpRequest)
        {// code for IE7+, Firefox, Chrome, Opera, Safari
            var xmlhttp = new XMLHttpRequest();
        }
        else
        {// code for IE6, IE5
            var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange=function()
        {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
            {
                let responseText = xmlhttp.responseText;
                // console.log(responseText)
                callback(responseText);
            }
        }
        xmlhttp.open("GET", theUrl, false );
        xmlhttp.send(); // NS_ERROR_FAILURE is here
    },
    httpPost: function(theUrl, payload, callback)
    {
        if (window.XMLHttpRequest)
        {// code for IE7+, Firefox, Chrome, Opera, Safari
            var xmlhttp = new XMLHttpRequest();
        }
        else
        {// code for IE6, IE5
            var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        // xmlhttp.onreadystatechange=function()
        // {
        //     if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
        //     {
        //         let responseText = xmlhttp.responseText;
        //         // console.log(responseText)
        //         callback(responseText);
        //     }
        // }
        xmlhttp.open("POST", theUrl, false );
        xmlhttp.setRequestHeader('Content-type', 'text/html')
        xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
            if(xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                alert(xmlhttp.responseText);
            }
        }

        xmlhttp.send(payload); // NS_ERROR_FAILURE is here
    }
}
// export default Exported;
module.exports = Exported;

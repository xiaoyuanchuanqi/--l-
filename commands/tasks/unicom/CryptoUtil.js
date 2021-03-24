const CryptoJS = require("crypto-js");
const crypto = require("crypto");

var CryptoJS_encrypt = function (word, keyStr) {
  var key = CryptoJS.enc.Utf8.parse(keyStr);
  var srcs = CryptoJS.enc.Utf8.parse(word);
  var encrypted = CryptoJS.AES.encrypt(srcs, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

var CryptoJS_decrypt = function (word, keyStr) {
  var key = CryptoJS.enc.Utf8.parse(keyStr);
  var decrypted = CryptoJS.AES.decrypt(word, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

var CryptoJS_RC4_encrypt = function (word, keyStr) {
  var key = CryptoJS.enc.Utf8.parse(keyStr);
  var srcs = CryptoJS.enc.Utf8.parse(word);
  var encrypted = CryptoJS.RC4.encrypt(srcs, key, {
    iv: keyStr,
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

var crypto_encrypt = function (data, key) {
  var iv = "";
  var cipherEncoding = 'base64';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}

var crypto_decrypt = function (data, key) {
  var iv = "";
  var clearEncoding = 'utf8';
  var cipherEncoding = 'base64';
  var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
  decipher.setAutoPadding(true);
  return Buffer.concat([decipher.update(data, cipherEncoding), decipher.final()]).toString(clearEncoding);
}

var secretkeyArrayV1 = function () {
  for (var e = [], t = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E",
    "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
    "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q",
    "r", "s", "t", "u", "v", "w", "x", "y", "z"], i = 0;
       5 > i;
       i++) {
    for (var n = "", s = 0; 16 > s; s++) {
      var a = Math.floor(62 * Math.random());
      n += t[a]
    }
    e.push(n)
  }
  return e;
}

var CryptoUtil = {
  crypto_decrypt,
  crypto_encrypt,
  CryptoJS_encrypt,
  CryptoJS_decrypt,
  encryptParamsV1: (params) => {
    let parKey = secretkeyArrayV1()
    let n = Math.floor(Math.random() * 5)
    return {
      "params": CryptoJS_encrypt(JSON.stringify(params), parKey[n]) + n,
      "parKey": parKey
    }
  },
  encryptParamsV3: (params, jfid) => {
    return {
      "params": CryptoJS_RC4_encrypt(JSON.stringify(params), jfid.slice(0x3, 0x13))
    }
  },
  signRewardVideoParams: (data) => {
    let str = 'integralofficial&'
    let params = []
    data.forEach((v, i) => {
      if (v) {
        params.push('arguments' + (i + 1) + v)
      }
    });
    return crypto.createHash('md5').update(str + params.join('&')).digest('hex')
  }
}

module.exports = CryptoUtil
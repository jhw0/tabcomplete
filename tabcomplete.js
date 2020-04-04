(function() {
  //variables used in tab completion
  var trieW = new Triejs({
    returnRoot: true,
    insert: function(target, data) {
      if (target && target.length) {
        var done = false;
        for (var t of target) {
          if (t[0] === data.word) {
            t[1] += data.count;
            done = true;
          }
        }
        if (!done) target.push([data.word, data.count])
      } else {
        target = [[data.word, data.count]];
      }
      return target;
    },
    sort: function() {
      this.sort(function(a, b) {
        return b[1] - a[1];
      })
    }
  });

  var trieS = new Triejs({
    returnRoot: true,
    insert: function(target, data) {
      if (target && target.length) {
        var done = false;
        for (var t of target) {
          if (t[0] === data.from && t[1] === data.next) {
            t[2] += data.count;
            done = true;
          }
        }
        if (!done) target.push([data.from, data.next, data.count])
      } else {
        target = [[data.from, data.next, data.count]];
      }
      return target;
    },
    sort: function() {
      this.sort(function(a, b) {
        return b[2] - a[2];
      })
    }
  });

  var loadFromStorage = function () {
    let s = localStorage.getItem("next-words");
    if (!s) return;
    let items = JSON.parse(s);
    for (let item of items) {
      trieS.add(item[0], {
        from: item[0],
        next: item[1],
        count: item[2],
      })
    }
    s = localStorage.getItem("words");
    items = JSON.parse(s);
    for (let item of items) {
      trieW.add(item[0], {
        word: item[0],
        count: item[1]
      })
    }
  };

  var onclickHandler = function () {
    var val = input.value;
    if (val.length === 0) return;
    input.value = "";
    var words = val.trim().split(/\s+/);
    for (var i = 0, len = words.length; i < len - 1; i++) {
      trieW.add(words[i], {
        word: words[i],
        count: 1
      });
      trieS.add(words[i], {
        from: words[i],
        next: words[i+1],
        count: 1
      })
    }
    trieW.add(words[words.length-1], {
      word: words[words.length-1],
      count: 1
    });
    var data = trieW.find("");
    localStorage.setItem("words", JSON.stringify(data));
    data = trieS.find("");
    localStorage.setItem("next-words", JSON.stringify(data));
  };

  var pattern = "",
    candidates = null,
    patternPos = -1,
    preStr = "",
    suggestS = false,
    isUpper = false;

  var onBlurHandler = function (event) {
    sc.style.display = 'none';
  };

  var onKeyDownHandler = function (event) {
    event = event || window.event;
    if (event.keyCode === 9) {
      event.preventDefault ? event.preventDefault() : event.returnValue = false;
    }
    sc.style.display = 'none';
  };

  var onKeyUpHandler = function (event) {
    var key = window.event ? event.keyCode : event.which;
    if (key === 9) {
      if (candidates && candidates.length > 0) {
        var complete = candidates[0];
        if (isUpper) complete = complete.charAt(0).toUpperCase() + complete.slice(1);
        input.value = suggestS ? preStr + ' ' + complete :  preStr + complete;
      }
    }

    preStr = "";
    suggestS = false;
    candidates = null;
    if (input.value.length === 0) {
      return
    }

    pattern = input.value;
    patternPos = pattern.lastIndexOf(" ");
    if (patternPos !== -1 ) {
      preStr = pattern.substr(0, patternPos + 1);
      pattern = pattern.substr(patternPos + 1);
    }

    var len = pattern.length;
    if (len === 0) {
      sc.style.display = 'none';
      return
    }

    var cap = pattern.charAt(0);
    isUpper = cap >= 'A' && cap <= 'Z';
    var words = trieW.find(pattern);

    if (words) {
      candidates = words.map(function f(e) { return e[0]});
    }

    if (candidates && candidates.length === 1 && candidates[0] === pattern) {
      candidates = null;
    }

    if (!candidates) {
      words = trieS.find(pattern);
      if (words) {
        candidates = words.map(function f(e) { return e[1]});
        suggestS = true;
        preStr = input.value;
      }
    }

    if (candidates && candidates.length > 0) {
      var suggest = suggestS ? candidates[0] : candidates[0].substr(len);
      var pos = (suggestS ? 1.3 : 0.3) + input.value.length;

      if (pos + suggest.length > 40)
        return;

      text.nodeValue = suggest;
      sc.style.display = 'block';
      sc.style.left = pos.toString() + "ch";
    }
  };

  var input = document.getElementById("text_input");
  input.focus();
  input.onkeydown = onKeyDownHandler;
  input.onkeyup = onKeyUpHandler;
  input.onblur = onBlurHandler;

  var sc = document.createElement('div');
  sc.className = "autocomplete-text";

  var text = document.createTextNode("");
  text.className = "text";
  sc.appendChild(text);

  var content = document.getElementById("content");
  content.appendChild(sc);

  var btn = document.getElementById("btn");
  btn.onclick = onclickHandler;
  loadFromStorage();
})();

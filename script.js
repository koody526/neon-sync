// ===============================
// NEON SYNC 이미지 배경형 v2.8 JS
// ===============================

let balance = 0;
let isVerified = false;
let isAuthBusy = false;
let correctPattern = [];
let userPattern = [];
let dispenseTimer = null;

const colorNames = ["red", "blue", "green", "yellow"];

const drinks = [
  { id: 0, name: "생수", price: 800, stock: 5, isHighCaffeine: false, icon: "images/water.png" },
  { id: 1, name: "보리차", price: 1000, stock: 5, isHighCaffeine: false, icon: "images/barley_tea.png" },
  { id: 2, name: "제로콜라", price: 1500, stock: 5, isHighCaffeine: false, icon: "images/zero_cola.png" },
  { id: 3, name: "이온음료", price: 1800, stock: 4, isHighCaffeine: false, icon: "images/ion_drink.png" },
  { id: 4, name: "딥러닝 아메리카노", price: 2000, stock: 3, isHighCaffeine: true, icon: "images/americano.png" },
  { id: 5, name: "알고리즘 콜드브루", price: 2500, stock: 2, isHighCaffeine: true, icon: "images/coldbrew.png" },
  { id: 6, name: "에너지드링크", price: 3000, stock: 3, isHighCaffeine: true, icon: "images/energy_drink.png" },
  { id: 7, name: "VR부스터", price: 3500, stock: 2, isHighCaffeine: true, icon: "images/vr_booster.png" }
];

function updateUI() {
  const container = document.getElementById("product-section");
  container.innerHTML = "";

  drinks.forEach(function(drink) {
    const needsAuth = drink.isHighCaffeine && !isVerified;
    const isSoldOut = drink.stock <= 0;
    const canAfford = balance >= drink.price;
    const canBuy = !needsAuth && !isSoldOut && canAfford;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "drink-card";
    card.onclick = function() {
      buyDrink(drink.id);
    };

      if (needsAuth) card.classList.add("locked");
      if (isSoldOut) card.classList.add("soldout");
      if (canBuy) card.classList.add("active");

      /*
        잠금/금액 부족/품절 상태에서도 클릭 안내가 뜨도록
        disabled 처리는 하지 않는다.
        실제 구매 가능 여부는 buyDrink() 함수 안에서 다시 검사한다.
      */

    let stateText = "대기";
    if (isSoldOut) stateText = "품절";
    else if (needsAuth) stateText = "잠금";
    else if (canAfford) stateText = "구매";

    const stockClass = drink.stock <= 2 ? "drink-stock low" : "drink-stock";

    card.innerHTML = `
      <div class="slot-number">SLOT ${String(drink.id + 1).padStart(2, "0")}</div>
      <img class="drink-icon" src="${drink.icon}" alt="${drink.name}">
      <div class="drink-name">${drink.name}</div>
      <div class="drink-price">${drink.price.toLocaleString()}원</div>
      <div class="${stockClass}">재고 ${drink.stock}</div>
      <div class="drink-state">${stateText}</div>
    `;

    container.appendChild(card);
  });

    updateScreen("금액을 투입하세요");
  document.getElementById("current-amount").innerText = balance.toLocaleString() + "원";
}

function updateScreen(message) {
  const msg = document.getElementById("screen-message");
  if (message) msg.innerText = message;
}

function insertMoney(amount) {
  balance += amount;
  updateUI();
  updateScreen(amount.toLocaleString() + "원 투입");
}

function buyDrink(id) {
    const drink = drinks.find(function (item) {
        return item.id === id;
    });

    if (!drink) return;

    // 1. 먼저 재고 확인
    if (drink.stock <= 0) {
        alert("품절된 음료입니다.");
        return;
    }

    // 2. 고카페인 음료 인증 확인
    if (drink.isHighCaffeine && !isVerified) {
        alert("NEON SYNC 인증이 필요한 음료입니다.");
        return;
    }

    // 3. 투입 금액 확인
    if (balance < drink.price) {
        alert("투입 금액이 부족합니다.");
        return;
    }

    // 4. 구매 처리
    balance -= drink.price;
    drink.stock -= 1;

    updateUI();
    updateScreen(drink.name + " 구매 완료");
    showDispense(drink);
}

function showDispense(drink) {
  const emojiEl = document.getElementById("dispense-emoji");
  const textEl = document.getElementById("dispense-text");

  if (dispenseTimer !== null) {
    clearTimeout(dispenseTimer);
    dispenseTimer = null;
  }

  emojiEl.classList.remove("dispense-animate");
  textEl.classList.remove("dispense-animate");

  emojiEl.innerText = "";
  textEl.innerText = "배출 준비 중...";
  textEl.style.color = "var(--yellow)";

  dispenseTimer = setTimeout(function() {
    emojiEl.innerHTML = `<img class="dispense-icon" src="${drink.icon}" alt="${drink.name}">`;
    textEl.innerText = drink.name + " 배출 완료";
    textEl.style.color = "var(--green)";

    void emojiEl.offsetWidth;
    void textEl.offsetWidth;
    emojiEl.classList.add("dispense-animate");
    textEl.classList.add("dispense-animate");

    dispenseTimer = null;
  }, 600);
}

function refundMoney() {
  if (balance <= 0) {
    alert("반환할 금액이 없습니다.");
    return;
  }

  if (dispenseTimer !== null) {
    clearTimeout(dispenseTimer);
    dispenseTimer = null;
  }

  const refundAmount = balance;
  balance = 0;

  document.getElementById("dispense-emoji").innerText = "💰";
  document.getElementById("dispense-text").innerText = refundAmount.toLocaleString() + "원 반환";
  document.getElementById("dispense-text").style.color = "var(--yellow)";

  updateUI();
  updateScreen("잔돈 반환 완료");
}

function generateRandomPattern() {
  const pattern = [];
  for (let i = 0; i < 4; i++) {
    pattern.push(Math.floor(Math.random() * 4));
  }
  return pattern;
}

function startAuth() {
  if (isVerified) {
    alert("이미 인증이 완료되었습니다.");
    return;
  }
  if (isAuthBusy) return;

  isAuthBusy = true;
  userPattern = [];
  correctPattern = generateRandomPattern();

  document.getElementById("screen-message").innerText = "패턴을 기억하세요.";
  document.getElementById("screen-message").style.color = "white";
  document.getElementById("pattern-dots").innerHTML = "";

  setColorButtonsEnabled(false);
  showPatternAnimation(correctPattern, function() {
    resetPatternDots();
    updateUserDots();
    document.getElementById("screen-message").innerText = "같은 순서로 입력";
    setColorButtonsEnabled(true);
    isAuthBusy = false;
  });
}

function showPatternAnimation(pattern, callback) {
  let delay = 350;

  pattern.forEach(function(colorIndex) {
    setTimeout(function() {
      flashColor(colorIndex);
      addPatternDot(colorIndex);
    }, delay);
    delay += 650;
  });

  setTimeout(callback, delay + 150);
}

function addPatternDot(colorIndex) {
  const dots = document.getElementById("pattern-dots");
  const dot = document.createElement("span");
  dot.className = "dot " + colorNames[colorIndex];
  dots.appendChild(dot);
}

function resetPatternDots() {
  document.getElementById("pattern-dots").innerHTML = "";
}

function updateUserDots() {
  const dots = document.getElementById("pattern-dots");
  dots.innerHTML = "";
  for (let i = 0; i < correctPattern.length; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    if (i < userPattern.length) {
      dot.classList.add(colorNames[userPattern[i]]);
    }
    dots.appendChild(dot);
  }
}

function setColorButtonsEnabled(enabled) {
  document.querySelectorAll(".color-hit").forEach(function(btn) {
    btn.disabled = !enabled;
  });
}

function handleColorClick(colorIndex) {
  if (isVerified || isAuthBusy) return;
  if (correctPattern.length === 0) {
    updateScreen("먼저 모니터 클릭");
    return;
  }

  flashColor(colorIndex);
  userPattern.push(colorIndex);
  updateUserDots();

  const currentIndex = userPattern.length - 1;

  if (userPattern[currentIndex] !== correctPattern[currentIndex]) {
    updateScreen("인증 실패");
    setColorButtonsEnabled(false);
    userPattern = [];

    setTimeout(function() {
      correctPattern = [];
      resetPatternDots();
      updateScreen("다시 인증하세요.");
    }, 1200);
    return;
  }

  if (userPattern.length === correctPattern.length) {
    isVerified = true;
    setColorButtonsEnabled(false);
    resetPatternDots();
    updateScreen("NEON 인증 성공");
    updateUI();
  }
}

function flashColor(colorIndex) {
  const btn = document.querySelector('.color-hit[data-color="' + colorIndex + '"]');
  if (!btn) return;

  btn.classList.add("flash");
  setTimeout(function() {
    btn.classList.remove("flash");
  }, 280);
}

window.onload = function() {
  updateUI();
  setColorButtonsEnabled(false);

  document.getElementById("screen-hotspot").addEventListener("click", startAuth);
  document.getElementById("refund-hit").addEventListener("click", refundMoney);

  document.querySelectorAll(".pay-hit").forEach(function(btn) {
    btn.addEventListener("click", function() {
      insertMoney(Number(this.getAttribute("data-money")));
    });
  });

  document.querySelectorAll(".color-hit").forEach(function(btn) {
    btn.addEventListener("click", function() {
      handleColorClick(Number(this.getAttribute("data-color")));
    });
  });
};

# Công nghệ sử dụng

- Vite + Typescript: khởi động nhanh, cấu hình nhẹ.
- Phaser: một HTML5 game framwork mã nguồn mở.Phaser sử dụng Pixi.js để rendering trên WebGL và Canvas.

# Thông tin Game Bubble Shooter

## Hexagon grid

- Game sử dụng bố cục hexagon grid.
- Ưu điểm:

* Các quả bóng xếp khít nhau theo dạng tổ ong.
* Hỗ trợ cơ chế rơi xuống tự nhiên.
* Dễ tính toán va chạm và gắn kết.

## Mục tiêu

- Người chơi điều khiển shooter ở cuối màn hình.
- Bắn bóng lên phía trên để ghép thành cụm >= 3 bóng cùng màu.
- Trò chơi kết thúc khi game chạm đáy.

## Cơ chế game:

- Bắn bóng: người chơi chọn hướng và bắn.
- Va chạm: bóng sẽ gắn vào lưới gần nhất.
- Ghép nhóm: lớn hơn 3 bóng cùng màu thì biến mất.

## Giao diện:

- Shooter: nằm ở giũa phía dưới.
- Lưới bóng: hiển thị phía trên.
- Thanh điểm.

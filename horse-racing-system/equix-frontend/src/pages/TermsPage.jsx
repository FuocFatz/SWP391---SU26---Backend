import './TermsPage.css';

function TermsPage() {
  return (
    <div className="terms-page" id="terms-page">
      <div className="container">
        <div className="terms-header">
          <h1 className="terms-title">Điều khoản dịch vụ</h1>
          <p className="terms-updated">Cập nhật lần cuối: Tháng 6 năm 2026</p>
        </div>

        <div className="terms-content">
          <div className="terms-toc">
            <h3 className="terms-toc-title">Nội dung</h3>
            <a href="#acceptance" className="terms-toc-link">1. Chấp nhận điều khoản</a>
            <a href="#accounts" className="terms-toc-link">2. Tài khoản người dùng</a>
            <a href="#roles" className="terms-toc-link">3. Vai trò người dùng</a>
            <a href="#guess-system" className="terms-toc-link">4. Hệ thống dự đoán</a>
            <a href="#races" className="terms-toc-link">5. Quy định cuộc đua</a>
            <a href="#privacy" className="terms-toc-link">6. Quyền riêng tư và dữ liệu</a>
            <a href="#disclaimer" className="terms-toc-link">7. Tuyên bố miễn trừ</a>
          </div>

          <div className="terms-body">
            <section id="acceptance" className="terms-section">
              <h2>1. Chấp nhận điều khoản</h2>
              <p>
                Khi truy cập và sử dụng Hệ thống quản lý giải đua ngựa EquiX, bạn đồng ý tuân thủ các Điều khoản dịch vụ này. Nền tảng được phát triển như một dự án học thuật cho môn SWP391 tại FPT College Vietnam.
              </p>
            </section>

            <section id="accounts" className="terms-section">
              <h2>2. Tài khoản người dùng</h2>
              <p>
                Tài khoản Chủ ngựa và Nài ngựa cần Quản trị viên xác nhận trước khi kích hoạt. Tài khoản Khán giả được kích hoạt ngay sau khi đăng ký. Tài khoản Trọng tài chỉ có thể do Quản trị viên tạo.
              </p>
            </section>

            <section id="roles" className="terms-section">
              <h2>3. Vai trò và trách nhiệm</h2>
              <p>
                Nền tảng hỗ trợ năm vai trò: Chủ ngựa, Nài ngựa, Trọng tài, Khán giả và Quản trị viên. Mỗi vai trò có quyền hạn và giới hạn riêng nhằm duy trì tính công bằng và toàn vẹn hệ thống.
              </p>
              <ul className="terms-list">
                <li><strong>Chủ ngựa</strong> quản lý ngựa, thuê nài ngựa và đăng ký cặp tham gia cuộc đua.</li>
                <li><strong>Nài ngựa</strong> chấp nhận lời mời, cưỡi ngựa và tích lũy thành tích.</li>
                <li><strong>Trọng tài</strong> điều hành cuộc đua, quyết định loại và lập báo cáo.</li>
                <li><strong>Khán giả</strong> xem cuộc đua và dự đoán kết quả.</li>
                <li><strong>Quản trị viên</strong> giám sát toàn bộ hệ thống, bao gồm tài khoản và cuộc đua.</li>
              </ul>
            </section>

            <section id="guess-system" className="terms-section">
              <h2>4. Hệ thống dự đoán</h2>
              <p>
                Tính năng dự đoán chỉ phục vụ mục đích học thuật, không phải nền tảng cờ bạc hoặc cá cược và không sử dụng tiền thật. Mỗi khán giả được dự đoán đúng một cặp ngựa–nài ngựa cho mỗi cuộc đua. Dự đoán sẽ khóa khi cuộc đua chuyển sang Chờ xuất phát.
              </p>
            </section>

            <section id="races" className="terms-section">
              <h2>5. Quy định cuộc đua</h2>
              <p>
                Mỗi cuộc đua cần tối thiểu 6 và tối đa 18 cặp ngựa–nài ngựa. Đăng ký đóng một tuần trước ngày đua. Thời gian được phép rút lui là từ 3 ngày đến một tuần trước cuộc đua. Kết quả được công bố qua hai bước: Trọng tài gửi báo cáo và Quản trị viên xác nhận.
              </p>
            </section>

            <section id="privacy" className="terms-section">
              <h2>6. Quyền riêng tư và dữ liệu</h2>
              <p>
                Dữ liệu người dùng được bảo vệ bằng xác thực JWT. Thông tin hồ sơ chỉ hiển thị cho người dùng khác trong phạm vi tương tác giữa các vai trò. Ảnh ngựa được lưu trên máy chủ và có thể bị xóa khi tài khoản bị xóa.
              </p>
            </section>

            <section id="disclaimer" className="terms-section">
              <h2>7. Tuyên bố miễn trừ</h2>
              <p>
                EquiX là dự án giáo dục được phát triển cho môn SWP391. Kết quả cuộc đua được mô phỏng ngẫu nhiên. Nền tảng không liên quan đến ngựa thật, nài ngựa thật hoặc giao dịch tiền thật. Mọi điểm thưởng trong hệ thống chỉ dùng cho mục đích trình diễn.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;

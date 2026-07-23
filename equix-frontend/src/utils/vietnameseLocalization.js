const exactTranslations = new Map(Object.entries({
  Home: 'Trang chủ', Races: 'Cuộc đua', Leaderboard: 'Bảng xếp hạng', About: 'Giới thiệu', FAQ: 'Hỏi đáp',
  Login: 'Đăng nhập', Register: 'Đăng ký', Logout: 'Đăng xuất', Dashboard: 'Bảng điều khiển', Profile: 'Hồ sơ', Settings: 'Cài đặt',
  Notifications: 'Thông báo', Refresh: 'Làm mới', View: 'Xem', Edit: 'Chỉnh sửa', Delete: 'Xóa', Save: 'Lưu', Cancel: 'Hủy', Close: 'Đóng',
  Confirm: 'Xác nhận', Submit: 'Gửi', Actions: 'Thao tác', Action: 'Thao tác', Status: 'Trạng thái', Date: 'Ngày', Created: 'Ngày tạo', Updated: 'Cập nhật',
  Email: 'Email', 'Email Address': 'Địa chỉ email', Password: 'Mật khẩu', 'Current password': 'Mật khẩu hiện tại', 'New password': 'Mật khẩu mới',
  'Confirm Password': 'Xác nhận mật khẩu', 'Confirm new password': 'Xác nhận mật khẩu mới', 'Full Name': 'Họ và tên', Phone: 'Số điện thoại', Role: 'Vai trò',
  User: 'Người dùng', Accounts: 'Tài khoản', Account: 'Tài khoản', Tournaments: 'Giải đấu', Tournament: 'Giải đấu', Horses: 'Ngựa', Horse: 'Ngựa',
  'Horse name': 'Tên ngựa', 'Horse Owner': 'Chủ ngựa', 'Horse Owners': 'Chủ ngựa', Owner: 'Chủ ngựa', Jockey: 'Nài ngựa', Jockeys: 'Nài ngựa',
  Referee: 'Trọng tài', Referees: 'Trọng tài', Spectator: 'Khán giả', Spectators: 'Khán giả', Administrator: 'Quản trị viên', Admins: 'Quản trị viên',
  'My Horses': 'Ngựa của tôi', 'Hire Jockey': 'Thuê nài ngựa', Pairings: 'Ghép cặp', 'My Horse': 'Ngựa của tôi', Invitations: 'Lời mời',
  Achievements: 'Thành tích', 'Assigned Races': 'Cuộc đua được phân công', 'Race Monitor': 'Điều hành cuộc đua', Reports: 'Báo cáo',
  'Browse Races': 'Xem cuộc đua', 'My Guesses': 'Dự đoán của tôi', 'My Rewards': 'Phần thưởng của tôi', Results: 'Kết quả', Guesses: 'Dự đoán',
  'Reward Fulfillment': 'Xử lý phần thưởng', Analytics: 'Thống kê', Points: 'Điểm', Point: 'Điểm', 'Reward Points': 'Điểm thưởng', Reward: 'Phần thưởng',
  Rewards: 'Phần thưởng', Prize: 'Giải thưởng', 'Prize Pool': 'Tổng điểm thưởng', 'Prize pool (VND)': 'Tổng điểm thưởng (point)',
  'Prize Pool (VND)': 'Tổng điểm thưởng (point)', 'Exhibition Race': 'Cuộc đua giao hữu', 'No Prize Pool': 'Không có điểm thưởng',
  Rank: 'Hạng', Position: 'Vị trí', Wins: 'Số trận thắng', 'Top 3': 'Top 3',
  'All Races': 'Tất cả cuộc đua', 'Search races': 'Tìm cuộc đua', 'Search by race name': 'Tìm theo tên cuộc đua',
  'Race status': 'Trạng thái cuộc đua', 'Race type': 'Loại cuộc đua', 'All Status': 'Tất cả trạng thái', 'All Types': 'Tất cả loại',
  'Loading races...': 'Đang tải cuộc đua...', 'Loading race details...': 'Đang tải chi tiết cuộc đua...', 'Race not found': 'Không tìm thấy cuộc đua',
  'Back to Races': 'Quay lại danh sách cuộc đua', 'Race Results': 'Kết quả cuộc đua', Participants: 'Người tham gia', Lane: 'Làn đua', Time: 'Thời gian',
  Distance: 'Cự ly', 'Distance (metres)': 'Cự ly (mét)', 'Race date': 'Ngày đua', 'Start time': 'Giờ bắt đầu',
  'Maximum participants': 'Số người tham gia tối đa', 'Race name': 'Tên cuộc đua', 'Create Race': 'Tạo cuộc đua', 'Create race': 'Tạo cuộc đua',
  'Race List': 'Danh sách cuộc đua', 'Open registration': 'Mở đăng ký', 'Close registration': 'Đóng đăng ký', 'Reopen registration': 'Mở lại đăng ký',
  'Move to draft': 'Chuyển về bản nháp', 'Reassign referee': 'Đổi trọng tài', 'Prepared by Referee': 'Đã được trọng tài chuẩn bị',
  'Workflow locked': 'Quy trình đã khóa', 'Review & finalize': 'Kiểm tra và công bố', 'Request revision': 'Yêu cầu chỉnh sửa',
  'Waiting for revised report': 'Đang chờ báo cáo chỉnh sửa', 'Create Horse': 'Tạo ngựa', 'Create horse': 'Tạo ngựa', 'Edit Horse': 'Chỉnh sửa ngựa',
  'Save horse': 'Lưu ngựa', 'No horses yet': 'Chưa có ngựa', Gender: 'Giới tính', Breed: 'Giống ngựa', 'Age (years)': 'Tuổi', 'Weight (kg)': 'Cân nặng (kg)',
  'Speed (1–100)': 'Tốc độ (1–100)', 'Speed (1â€“100)': 'Tốc độ (1–100)', 'Stamina (1–100)': 'Thể lực (1–100)',
  'Stamina (1â€“100)': 'Thể lực (1–100)', 'Training position': 'Chiến thuật chạy', 'Owner-managed status': 'Trạng thái do chủ ngựa quản lý',
  Stallion: 'Ngựa đực', Mare: 'Ngựa cái', Gelding: 'Ngựa đực thiến', Front: 'Dẫn đầu', Pace: 'Giữ nhịp', Late: 'Tăng tốc cuối', End: 'Nước rút',
  Portrait: 'Ảnh ngựa', 'Available Races': 'Cuộc đua đang mở', 'Registered Pairs': 'Các cặp đã đăng ký', 'Horse Leaderboard': 'Bảng xếp hạng ngựa',
  'Invite jockey': 'Mời nài ngựa', 'Awaiting jockey': 'Đang chờ nài ngựa', 'Register pair': 'Đăng ký cặp', Registered: 'Đã đăng ký',
  Withdraw: 'Rút khỏi cuộc đua', Accept: 'Chấp nhận', Decline: 'Từ chối', Verify: 'Xác minh', Reject: 'Từ chối', Suspend: 'Tạm khóa',
  'Change role': 'Đổi vai trò', 'Create Account': 'Tạo tài khoản', 'Select Your Role': 'Chọn vai trò', 'Sign In': 'Đăng nhập',
  'Signing in...': 'Đang đăng nhập...', 'Create one': 'Tạo tài khoản', 'Reset it': 'Đặt lại', 'Forgot password?': 'Quên mật khẩu?',
  'Demo Quick Login': 'Đăng nhập nhanh', 'Secure login endpoint': 'Đăng nhập an toàn',
  'Select an active SQL Server account': 'Chọn một tài khoản đang hoạt động trên SQL Server', 'Back to login': 'Quay lại đăng nhập',
  'Reset Your Password': 'Đặt lại mật khẩu', 'Password Reset Successful': 'Đặt lại mật khẩu thành công', 'Go to Login': 'Đi đến đăng nhập',
  'My Profile': 'Hồ sơ của tôi', Preview: 'Xem trước', 'Account Information': 'Thông tin tài khoản', 'Change Password': 'Đổi mật khẩu',
  'Change Email': 'Đổi email', 'New email address': 'Địa chỉ email mới', 'Save Changes': 'Lưu thay đổi', 'Send verification': 'Gửi xác minh',
  'Mark all as read': 'Đánh dấu tất cả đã đọc', 'Mark as read': 'Đánh dấu đã đọc', Read: 'Đã đọc', 'Your Notifications': 'Thông báo của bạn',
  'Notification Center': 'Trung tâm thông báo', 'Create Reward Code': 'Tạo mã đổi thưởng', 'Fulfillment Queue': 'Danh sách xử lý',
  'Redeem code': 'Đổi mã', Redeem: 'Đổi mã', Code: 'Mã', Description: 'Mô tả', Quantity: 'Số lượng', Issued: 'Đã phát hành', Redeemed: 'Đã đổi',
  Pending: 'Đang chờ', Fulfilled: 'Đã hoàn thành', 'Analytics Center': 'Trung tâm thống kê', 'Total users': 'Tổng người dùng',
  Registrations: 'Lượt đăng ký', 'Guess success': 'Tỷ lệ dự đoán đúng', 'Total rewards': 'Tổng phần thưởng',
  'Operational Alerts': 'Cảnh báo vận hành', 'Top Horses': 'Ngựa dẫn đầu', 'No data available.': 'Chưa có dữ liệu.',
  'Current Positions': 'Thứ hạng hiện tại', 'Simulation State': 'Trạng thái mô phỏng', 'Start Race': 'Bắt đầu cuộc đua',
  'Prepare Standby': 'Chuyển sang chờ xuất phát', Simulate: 'Mô phỏng', Complete: 'Kết thúc', 'Race Control': 'Điều khiển cuộc đua',
  'Assigned race': 'Cuộc đua được phân công', 'Pre-race Checks': 'Kiểm tra trước cuộc đua', Check: 'Kiểm tra', 'Check completed': 'Đã kiểm tra',
  Fit: 'Đủ điều kiện', Disqualify: 'Loại khỏi cuộc đua', 'Submit Report': 'Gửi báo cáo', 'Signed Referee Report': 'Báo cáo đã ký của trọng tài',
  'Incident description (minimum 10 characters)': 'Mô tả sự cố (tối thiểu 10 ký tự)', 'Action taken': 'Biện pháp đã thực hiện',
  'Race time (seconds)': 'Thời điểm trong cuộc đua (giây)', 'General race incident': 'Sự cố chung của cuộc đua', 'Record incident': 'Ghi nhận sự cố',
  'Official Result Review': 'Kiểm tra kết quả chính thức', 'Return Referee Report': 'Trả lại báo cáo trọng tài',
  'Revision reason': 'Lý do yêu cầu chỉnh sửa', 'Send revision request': 'Gửi yêu cầu chỉnh sửa', 'Substitute Referee': 'Thay trọng tài',
  'Replacement referee': 'Trọng tài thay thế', Reason: 'Lý do', 'Confirm reassignment': 'Xác nhận đổi trọng tài',
  'Official results': 'Kết quả chính thức', 'Provisional results': 'Kết quả tạm thời', 'Race cancelled': 'Cuộc đua đã bị hủy',
  'Updated schedule': 'Lịch thi đấu đã cập nhật', Draft: 'Bản nháp', 'Registration Open': 'Đang mở đăng ký',
  'Registration Closed': 'Đã đóng đăng ký', Standby: 'Chờ xuất phát', Live: 'Đang diễn ra', Completed: 'Đã hoàn thành',
  'Report Ready': 'Đã có báo cáo', 'Revision Required': 'Cần chỉnh sửa', Official: 'Chính thức', Cancelled: 'Đã hủy', Available: 'Sẵn sàng',
  Training: 'Đang huấn luyện', Unavailable: 'Không sẵn sàng', Paired: 'Đã ghép cặp', 'Pending Admin': 'Chờ Quản trị viên duyệt',
  'Ready For Check': 'Sẵn sàng kiểm tra', 'Cleared To Race': 'Đủ điều kiện thi đấu', Withdrawn: 'Đã rút lui',
  'Rejected By Referee': 'Bị trọng tài từ chối', Verified: 'Đã xác minh', Suspended: 'Đã tạm khóa', Rejected: 'Đã từ chối', Healthy: 'Khỏe mạnh',
  HORSE_OWNER: 'Chủ ngựa', JOCKEY: 'Nài ngựa', REFEREE: 'Trọng tài', SPECTATOR: 'Khán giả', ADMIN: 'Quản trị viên',
  DRAFT: 'Bản nháp', REGISTRATION_OPEN: 'Đang mở đăng ký', REGISTRATION_CLOSED: 'Đã đóng đăng ký', STANDBY: 'Chờ xuất phát',
  IN_PROGRESS: 'Đang diễn ra', COMPLETED: 'Đã hoàn thành', REPORT_READY: 'Đã có báo cáo', REVISION_REQUIRED: 'Cần chỉnh sửa',
  OFFICIAL: 'Chính thức', CANCELLED: 'Đã hủy', AVAILABLE: 'Sẵn sàng', TRAINING: 'Đang huấn luyện', UNAVAILABLE: 'Không sẵn sàng',
  PAIRED: 'Đã ghép cặp', REGISTERED: 'Đã đăng ký', PENDING: 'Đang chờ', PENDING_ADMIN: 'Chờ Quản trị viên duyệt',
  OPEN: 'Đang mở', CLOSED: 'Đã đóng', ACTIVE: 'Đang hoạt động', INACTIVE: 'Không hoạt động', LOCKED: 'Đã khóa',
  APPROVED: 'Đã phê duyệt', ACCEPTED: 'Đã chấp nhận', DECLINED: 'Đã từ chối', PROVISIONAL: 'Tạm thời',
  DISQUALIFIED: 'Bị loại', DNF: 'Không hoàn thành', INJURED: 'Bị chấn thương', RACING: 'Đang thi đấu',
  'PENDING ADMIN': 'Chờ Quản trị viên duyệt', 'READY FOR CHECK': 'Sẵn sàng kiểm tra',
  'CLEARED TO RACE': 'Đủ điều kiện thi đấu', 'REJECTED BY REFEREE': 'Bị trọng tài từ chối',
  READY_FOR_CHECK: 'Sẵn sàng kiểm tra', CLEARED_TO_RACE: 'Đủ điều kiện thi đấu', WITHDRAWN: 'Đã rút lui',
  REJECTED_BY_REFEREE: 'Bị trọng tài từ chối', VERIFIED: 'Đã xác minh', SUSPENDED: 'Đã tạm khóa', REJECTED: 'Đã từ chối',
  HEALTHY: 'Khỏe mạnh', SPRINT: 'Nước rút', MILE: 'Một dặm', MEDIUM: 'Trung bình', LONG: 'Đường dài', TURF: 'Sân cỏ', DIRT: 'Sân đất',
  'Loading...': 'Đang tải...', 'No results': 'Không có kết quả', 'No notifications yet.': 'Chưa có thông báo.',
  'Authentication is required': 'Bạn cần đăng nhập để thực hiện thao tác này',
  'Only tournaments whose races are Draft or Cancelled can be deleted': 'Chỉ có thể xóa giải đấu khi mọi cuộc đua còn ở Bản nháp hoặc đã Hủy.',
  'Withdraw or cancel all active race registrations before deleting this tournament': 'Hãy rút hoặc hủy toàn bộ đăng ký đang hoạt động trước khi xóa giải đấu.',
  'Dissolve the active pairing before deleting this horse': 'Hãy rút đăng ký hoặc giải thể ghép cặp đang hoạt động trước khi xóa ngựa.',
  'Withdraw active race registrations before deleting this horse': 'Hãy rút các đăng ký cuộc đua đang hoạt động trước khi xóa ngựa.',
  'Welcome Back to the Race': 'Chào mừng trở lại đường đua',
  'Sign in securely to manage horses, assignments, results, and predictions.': 'Đăng nhập an toàn để quản lý ngựa, phân công, kết quả và dự đoán.',
  'Use your EquiX account credentials.': 'Sử dụng tài khoản EquiX của bạn.',
  'Enter your password': 'Nhập mật khẩu',
  'Show password': 'Hiện mật khẩu',
  'Do not have an account?': 'Bạn chưa có tài khoản?',
  'Show Administrator accounts': 'Hiển thị tài khoản quản trị viên',
  'Show Horse Owner accounts': 'Hiển thị tài khoản chủ ngựa',
  'Show Jockey accounts': 'Hiển thị tài khoản nài ngựa',
  'Show Referee accounts': 'Hiển thị tài khoản trọng tài',
  'Show Spectator accounts': 'Hiển thị tài khoản khán giả',
  'Close account list': 'Đóng danh sách tài khoản',
  'Pending Checks': 'Chờ kiểm tra',
  'Cleared Horses': 'Ngựa đủ điều kiện',
  'Official Races': 'Cuộc đua chính thức',
  'Official race summary (minimum 20 characters)': 'Tóm tắt cuộc đua chính thức (tối thiểu 20 ký tự)',
  'Summarize the race and reference all recorded incidents': 'Tóm tắt cuộc đua và đề cập mọi sự cố đã ghi nhận',
  'Report severity': 'Mức độ báo cáo',
  Information: 'Thông tin',
  'Minor issue': 'Vấn đề nhỏ',
  'Major issue': 'Vấn đề nghiêm trọng',
  'Critical issue': 'Vấn đề đặc biệt nghiêm trọng',
  'No action required / action details': 'Không cần xử lý / chi tiết xử lý',
  'Referee signature': 'Chữ ký trọng tài',
  'Type your full name': 'Nhập họ và tên của bạn',
  'I reviewed every incident and race note, and confirm this report is complete.': 'Tôi đã kiểm tra mọi sự cố và ghi chú, đồng thời xác nhận báo cáo đã đầy đủ.',
  'Submit signed report': 'Gửi báo cáo đã ký',
  'Race Incident Log': 'Nhật ký sự cố cuộc đua',
  'Mid-race incidents are notes only; disqualification is finalized in the post-race result.': 'Sự cố giữa cuộc đua chỉ là ghi chú; quyết định loại sẽ được chốt trong kết quả sau cuộc đua.',
  'Incident type': 'Loại sự cố',
  Severity: 'Mức độ',
  'Affected entry (optional)': 'Đối tượng bị ảnh hưởng (không bắt buộc)',
  Stumble: 'Vấp ngã',
  Interference: 'Cản trở',
  'False Start': 'Xuất phát sai',
  'Injury Observed': 'Phát hiện chấn thương',
  'Other Observation': 'Quan sát khác',
  Minor: 'Nhẹ', Major: 'Nghiêm trọng', Critical: 'Đặc biệt nghiêm trọng',
  'Mark this affected entry Did Not Finish, remove it from live tracking, and set the horse Unavailable.': 'Đánh dấu đối tượng này không hoàn thành, xóa khỏi theo dõi trực tiếp và chuyển ngựa sang không sẵn sàng.',
  'Confirm DNF': 'Xác nhận không hoàn thành',
  'Role-aware horse racing tournament management from registration to official results.': 'Quản lý giải đua ngựa theo từng vai trò, từ đăng ký đến kết quả chính thức.',
  Explore: 'Khám phá', Legal: 'Pháp lý', Support: 'Hỗ trợ', 'Terms of Service': 'Điều khoản dịch vụ',
  'Privacy Policy': 'Chính sách bảo mật', 'About EquiX': 'Giới thiệu EquiX', Contact: 'Liên hệ', 'Account Access': 'Truy cập tài khoản',
  'Built with React + Spring Boot + SQL Server': 'Xây dựng bằng React + Spring Boot + SQL Server',
  'Welcome Back to the': 'Chào mừng trở lại', Race: 'Cuộc đua',
  'Pending Approvals': 'Chờ phê duyệt', 'Select a tournament': 'Chọn giải đấu', 'Assigned referee': 'Trọng tài được phân công',
  'Select a referee': 'Chọn trọng tài', Sprint: 'Nước rút', Mile: 'Một dặm', Medium: 'Trung bình', Long: 'Đường dài',
  'Admin controls registration states; live and official states continue through the Referee workflow.': 'Quản trị viên quản lý trạng thái đăng ký; trạng thái đang đua và chính thức được tiếp tục trong quy trình của trọng tài.',
  'Your session expired. Please sign in again.': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Race Schedule Control': 'Điều chỉnh lịch cuộc đua',
  'Reschedule a future race or cancel it with automatic entry and guess rollback.': 'Đổi lịch cuộc đua tương lai hoặc hủy cuộc đua; hệ thống sẽ tự động hoàn tác đăng ký và dự đoán.',
  'New race date': 'Ngày đua mới', 'New start time': 'Giờ bắt đầu mới',
  'Required for cancellation or rescheduling': 'Bắt buộc khi hủy hoặc đổi lịch', 'Reschedule Race': 'Đổi lịch cuộc đua', 'Cancel Race': 'Hủy cuộc đua',
  'Registration Approvals': 'Phê duyệt đăng ký',
  'Verify pairs individually or approve the current review queue in bulk.': 'Duyệt từng cặp hoặc duyệt hàng loạt danh sách đang chờ.',
  'No pending registrations': 'Không có đăng ký đang chờ',
  'Account Management': 'Quản lý tài khoản',
  'Review identities, approval state, roles and account access.': 'Kiểm tra danh tính, trạng thái phê duyệt, vai trò và quyền truy cập tài khoản.',
  Search: 'Tìm kiếm', 'Search account management': 'Tìm trong quản lý tài khoản', ALL: 'TẤT CẢ',
  'HORSE OWNER': 'Chủ ngựa',
  'Ready Pairings': 'Cặp sẵn sàng', 'Display-only; does not affect race outcomes.': 'Chỉ dùng để hiển thị, không ảnh hưởng kết quả cuộc đua.',
  Health: 'Sức khỏe', Invitation: 'Lời mời', Assignments: 'Phân công', 'Upcoming Races': 'Cuộc đua sắp tới',
  'Career Points': 'Điểm sự nghiệp', 'Race Assignments': 'Phân công cuộc đua',
  'Open Races': 'Cuộc đua đang mở', Predictions: 'Dự đoán', 'Top Horse Points': 'Điểm ngựa cao nhất',
  'Race Guess': 'Dự đoán cuộc đua', 'Horse–jockey pair': 'Cặp ngựa–nài ngựa',
  'Select a registered horse-jockey pair': 'Chọn một cặp ngựa–nài ngựa đã đăng ký',
  'Wager points': 'Point dự đoán', 'Save Guess': 'Lưu dự đoán', 'My Predictions': 'Dự đoán của tôi',
  Stake: 'Point đã đặt', Payout: 'Point nhận được', 'No predictions yet': 'Chưa có dự đoán',
  'Claim prizes, follow deliveries, and keep your digital redemption codes secure.': 'Nhận phần thưởng, theo dõi giao nhận và bảo mật mã đổi thưởng điện tử của bạn.',
  'Reward summary': 'Tóm tắt phần thưởng', Claimed: 'Đã nhận', 'On the way': 'Đang giao', 'Received & used': 'Đã nhận và sử dụng',
  'Redeem a reward code': 'Đổi mã phần thưởng', 'Enter the one-time code created for your spectator account.': 'Nhập mã dùng một lần được tạo cho tài khoản Khán giả của bạn.',
  'Reward code': 'Mã phần thưởng', 'Search rewards': 'Tìm phần thưởng', 'Search by reward or recipient': 'Tìm theo phần thưởng hoặc người nhận',
  'Reward type': 'Loại phần thưởng', 'All reward types': 'Tất cả loại phần thưởng', 'Horse goods': 'Vật phẩm cho ngựa',
  Vouchers: 'Phiếu quà tặng', 'Drink coupons': 'Phiếu đồ uống', 'Reward status': 'Trạng thái phần thưởng', 'All statuses': 'Tất cả trạng thái',
  'No rewards found.': 'Không tìm thấy phần thưởng.',
  'Rewards from successful guesses will appear here after results become official.': 'Phần thưởng từ dự đoán đúng sẽ xuất hiện tại đây sau khi kết quả được công bố chính thức.',
  ISSUED: 'Đã phát hành', CLAIMED: 'Đã nhận', PROCESSING: 'Đang xử lý', SHIPPED: 'Đang giao', FULFILLED: 'Đã hoàn thành',
  REDEEMED: 'Đã đổi', EXPIRED: 'Đã hết hạn',
  INVITATION_RESPONSE: 'Phản hồi lời mời', ACCOUNT_APPROVED: 'Tài khoản được phê duyệt', ACCOUNT_STATUS_UPDATED: 'Trạng thái tài khoản đã cập nhật',
  RACE_STARTED: 'Cuộc đua đã bắt đầu', RACE_COMPLETED: 'Cuộc đua đã hoàn tất', RACE_CANCELLED: 'Cuộc đua đã hủy',
  'Pending account reviews': 'Tài khoản đang chờ xét duyệt', 'Rewards awaiting action': 'Phần thưởng đang chờ xử lý',
  'Your demo account is active and ready to use.': 'Tài khoản của bạn đang hoạt động và sẵn sàng sử dụng.',
  'Account status updated': 'Trạng thái tài khoản đã được cập nhật', 'Jockey responded': 'Nài ngựa đã phản hồi',
  'Race started': 'Cuộc đua đã bắt đầu', 'Provisional race completed': 'Cuộc đua tạm thời đã hoàn tất',
  'Idempotent local dataset for the SWP391 final demonstration.': 'Bộ dữ liệu cục bộ có thể khởi tạo lại an toàn cho phần trình bày cuối kỳ SWP391.',
  'Presentation tournament with fully prepared race entries.': 'Giải đấu trình bày với danh sách tham gia đã được chuẩn bị đầy đủ.',
  'Choose image': 'Chọn ảnh', 'Save avatar': 'Lưu ảnh đại diện', 'JPG, PNG or WebP · maximum 5 MB': 'JPG, PNG hoặc WebP · tối đa 5 MB',
  'Optional phone number': 'Số điện thoại không bắt buộc', 'At least 8 characters with one letter and one number.': 'Ít nhất 8 ký tự, gồm tối thiểu một chữ cái và một chữ số.',
  'Your current email remains active until you verify the new address. Verification links expire after 30 minutes.': 'Email hiện tại vẫn hoạt động cho đến khi bạn xác minh địa chỉ mới. Liên kết xác minh hết hạn sau 30 phút.',
  'You are all caught up': 'Bạn đã xem tất cả thông báo', 'Refresh notifications': 'Làm mới thông báo',
  'Important account, invitation, race, and reward updates will appear here.': 'Các cập nhật quan trọng về tài khoản, lời mời, cuộc đua và phần thưởng sẽ xuất hiện tại đây.',
  'Verify New Email': 'Xác minh email mới', 'Email Updated': 'Đã cập nhật email', 'Sign in with new email': 'Đăng nhập bằng email mới',
  'Confirm this request to replace the email address on your EquiX account.': 'Xác nhận yêu cầu thay đổi địa chỉ email của tài khoản EquiX.',
  'Verifying...': 'Đang xác minh...', 'Verify new email': 'Xác minh email mới',
  'Back to Login': 'Quay lại đăng nhập', 'Enter the email address associated with your account, and we\'ll send you a link to reset your password.': 'Nhập email của tài khoản; hệ thống sẽ gửi liên kết đặt lại mật khẩu.',
  'Sending...': 'Đang gửi...', 'Send Reset Link': 'Gửi liên kết đặt lại', 'Remember your password?': 'Bạn nhớ mật khẩu?',
  'Enter your new password below. Make sure to use a strong, unique password.': 'Nhập mật khẩu mới bên dưới. Hãy sử dụng mật khẩu mạnh và riêng biệt.',
  'Resetting...': 'Đang đặt lại...', 'Reset Password': 'Đặt lại mật khẩu',
  'Your password has been successfully reset. You will be redirected to the login page shortly.': 'Mật khẩu đã được đặt lại thành công. Bạn sẽ sớm được chuyển đến trang đăng nhập.',
}));

const phraseRules = [
  [/\bVND\b/gi, 'point'], [/\bUSD\b/gi, 'point'],
  [/^Showing (\d+) of (\d+) races$/i, 'Đang hiển thị $1/$2 cuộc đua'],
  [/^Up to (\d+) pairs$/i, 'Tối đa $1 cặp'], [/^(\d+) participants$/i, '$1 người tham gia'],
  [/^(\d+) unread updates?$/i, '$1 thông báo chưa đọc'], [/^(\d+) unread notifications?$/i, '$1 thông báo chưa đọc'],
  [/^Race #(\d+)$/i, 'Cuộc đua #$1'], [/^Horse #(\d+)$/i, 'Ngựa #$1'], [/^Jockey #(\d+)$/i, 'Nài ngựa #$1'], [/^Lane (\d+)$/i, 'Làn $1'],
  [/^Welcome back,?$/i, 'Chào mừng trở lại,'], [/^(.+) workspace$/i, 'Khu vực làm việc: $1'],
  [/^(.+) workflow dashboard$/i, 'Bảng điều khiển nghiệp vụ: $1'], [/^(.+) accounts$/i, 'Danh sách tài khoản $1'],
  [/^(.+) completed$/i, 'Đã hoàn tất: $1'], [/^Current page: (.+)$/i, 'Trang hiện tại: $1'],
  [/^Delete (.+)$/i, 'Xóa $1'],
  [/^Owner #(\d+)$/i, 'Chủ ngựa #$1'], [/^Horse for (.+)$/i, 'Ngựa cho $1'], [/^Jockey for (.+)$/i, 'Nài ngựa cho $1'],
  [/^(\d+) points available$/i, '$1 point khả dụng'],
  [/^Maximum available: (\d+) points\. A winning guess pays 2× the stake\.$/i, 'Tối đa: $1 point. Dự đoán thắng nhận gấp 2 lần point đã đặt.'],
  [/^(\d+) results?$/i, '$1 kết quả'],
  [/^(.+) awaits the referee report and Admin finalization$/i, '$1 đang chờ báo cáo trọng tài và Quản trị viên xác nhận kết quả cuối cùng'],
  [/^(.+) is now in progress$/i, '$1 hiện đang diễn ra'],
  [/^(.+) accepted your invitation$/i, '$1 đã chấp nhận lời mời của bạn'],
  [/^Your account status is now (.+)\.$/i, 'Trạng thái tài khoản của bạn hiện là $1.'],
  [/^Request failed \((\d+)\)$/i, 'Yêu cầu thất bại ($1)'],
  [/\bpoints\b/gi, 'point'],
  [/\bHORSE_OWNER\b/g, 'Chủ ngựa'], [/\bJOCKEY\b/g, 'Nài ngựa'], [/\bREFEREE\b/g, 'Trọng tài'],
  [/\bSPECTATOR\b/g, 'Khán giả'], [/\bADMIN\b/g, 'Quản trị viên'],
];

export function translateText(value) {
  if (typeof value !== 'string' || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  const exact = exactTranslations.get(core);
  if (exact) return `${leading}${exact}${trailing}`;
  let translated = core;
  for (const [pattern, replacement] of phraseRules) translated = translated.replace(pattern, replacement);
  return `${leading}${translated}${trailing}`;
}

function translateElement(element) {
  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    if (!element.hasAttribute?.(attribute)) continue;
    const current = element.getAttribute(attribute);
    const translated = translateText(current);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
  if (element.tagName === 'INPUT' && (element.disabled || element.readOnly) && element.value) {
    const translatedValue = translateText(element.value);
    if (translatedValue !== element.value) element.value = translatedValue;
  }
}

function translateSubtree(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) return;
    const translated = translateText(root.nodeValue);
    if (translated !== root.nodeValue) root.nodeValue = translated;
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
        const translated = translateText(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
      }
    } else translateElement(node);
    node = walker.nextNode();
  }
}

export function installVietnameseLocalization() {
  if (typeof document === 'undefined' || globalThis.__equixVietnameseLocalizationInstalled) return;
  globalThis.__equixVietnameseLocalizationInstalled = true;
  document.documentElement.lang = 'vi';
  translateSubtree(document.body);
  let scheduled = false;
  const pendingRoots = new Set();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') pendingRoots.add(mutation.target);
      for (const node of mutation.addedNodes) pendingRoots.add(node);
    }
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      for (const root of roots) translateSubtree(root);
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}

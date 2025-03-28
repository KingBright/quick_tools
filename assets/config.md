### config.json 说明

part：表示对应的挖机部位

size：表示图片渲染大小

rotate_anchor：表示图片旋转位置，是图片坐标系中的位置

rotate_anchor_pos：是一个画布上的全局位置，通过rotate_anchor 结合图片渲染那尺寸计算出来的图片上的位置，再结合画布坐标得到画布上的全局位置

next_anchor：也是图片坐标系内的位置，表示下一张图片的rotate_anchor与本图片next_anchor重合的点，锚定需要转化成全局坐标系的点之后进行

rotate：当前姿态角，即在z轴上的旋转角

center：也是通过前面的位置信息算出来的图片在画布上的全局位置，是一个中间量，看需要是否要计算

rotate_anchor和next_anchor坐标说明：（0,0）表示图片正中心，左上角（-0.5,0.5）右上角（0.5,0.5）左下角（-0.5,-0.5），右下角（0.5，-0.5）

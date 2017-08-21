package com.cmb.bus.busmonitor.operation;

import java.sql.Connection;
import java.util.List;

import com.cmb.bus.common.util.Permission;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBSql;

/**
 * 执行率异常原因维护
 * @author WS02504
 * 输入 ： DTA_DTE-日期、BRN_NBR-支行、EXE_RAT-执行率、CAUSE-原因
 */
public class MntExeErrCause implements IOperation {
	private static final String MntExeErrCauseX1 = "MntExeErrCauseX1";
	
	@Override
	public int execute(IContext context) throws FrameworkException {
	
		ICacheTable input = context.getInputData().get(MntExeErrCauseX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		//操作类别
		String oprTyp = input.getString(0, "OPR_TYP");
		if (StringUtil.isEmpty(oprTyp)) {
			context.setErrorMessage("操作类别为空");
			return -1;
		}
		
		//操作参数
		List<String> colums = input.getFieldList();
		String dtaDte = input.getString(0, "DTA_DTE");
		String brnNbr = input.getString(0, "BRN_NBR");
		String exeRat = null;
		String cause  = null;
		if(colums.contains("EXE_RAT")){
			exeRat = input.getString(0, "EXE_RAT");
		}
		if(colums.contains("CAUSE")){
			cause  = input.getString(0, "CAUSE");
		}

		if (!Permission.checkPermission(context, brnNbr)) {
			context.setErrorMessage("没有接口权限, brnNbr = " + brnNbr);
			return -1;
		}
		
		//用户编号和数据库连接
		String userId	= context.getUserId();
		Connection conn = context.getConnection();
		
		//先删除，后新增
		String delSql = "DELETE FROM SCH.EXE_ERR_CAUSE WHERE DTA_DTE = ? AND BRN_NBR = ?";
		new DBSql(conn, delSql, dtaDte, brnNbr).execute();
		if("ADD".equals(oprTyp)){
			String istSql = "INSERT INTO SCH.EXE_ERR_CAUSE VALUES(?,?,?,?,?,CURRENT TIMESTAMP)";
			new DBSql(conn, istSql, dtaDte, brnNbr, exeRat, cause, userId).execute();
		}
		
		return 0;
	}
}

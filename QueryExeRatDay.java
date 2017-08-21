package com.cmb.bus.busmonitor.operation;

import java.sql.Connection;
import java.sql.Date;

import com.cmb.bus.common.util.Branch;
import com.cmb.bus.common.util.Permission;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.model.imp.CacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.IDBProcedure;
import com.frm.dao.model.imp.DBProcedure;

/**
 * 每日执行率查询
 * @author WS02504
 * 输入：DTA_MON-年月、BRN_NBR-排班组或支行
 * 输出：DTA_DTE-日期、EXE_RAT-执行率
 */
public class QueryExeRatDay implements IOperation {
	private static final String QueryExeRatDayX1 = "QueryExeRatDayX1";
	private static final String QueryExeRatDayZ1 = "QueryExeRatDayZ1";
	
	private static final String SP_NAME = "RPT.SP_MON_EXERAT_DAY_V1";
	
	@Override
	public int execute(IContext context) throws FrameworkException {
		ICacheTable input = context.getInputData().get(QueryExeRatDayX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		//权限校验
		if (!Permission.checkPermission(context)) {
			context.setErrorMessage("当前用户没有权限");
			return -1;
		}
		
		String brnNbr = input.getString(0, "BRN_NBR");
		Date dtaDte = input.getDate(0, "DTA_DTE");
		String schMdl = input.getSqlString(0, "SCH_MDL");

		//存储过程输入参数
		String sGrpNbr = "";
		String sBrnNbr = "";

		if (Branch.CMBCORNBR.equals(brnNbr) || Branch.isBbkNbr(brnNbr)) {
			context.setErrorMessage("输入机构不支持查询全行或分行");
			return -1;
		}
		
		if(Branch.isGroup(brnNbr)){
			sGrpNbr = brnNbr;
		}else{
			sGrpNbr = Branch.getGroup(brnNbr);
			sBrnNbr = brnNbr;
		}
		
		if(StringUtil.isEmpty(sGrpNbr)){
			context.setErrorMessage("输入机构有误，无法获取排班组");
			return -1;
		}
		
		context.commit();
		Connection conn = context.getConnection("busrptdb");
		
		IDBProcedure dbProcedure = new DBProcedure(conn, SP_NAME);
		dbProcedure.addInParameter("pDTA_DTE", java.sql.Types.DATE);
		dbProcedure.addInParameter("pGRP_NBR", java.sql.Types.CHAR);
		dbProcedure.addInParameter("pBRN_BRN", java.sql.Types.CHAR);
		dbProcedure.addInParameter("pSCH_MDL", java.sql.Types.CHAR);
		dbProcedure.addOutParameter("pRcdCnt", java.sql.Types.INTEGER);
		dbProcedure.addOutParameter("pErrMsg", java.sql.Types.VARCHAR);
		
		dbProcedure.execute(dtaDte, sGrpNbr, sBrnNbr, schMdl);
		
		String pErrMsg = dbProcedure.getOutputString("pErrMsg");
		if (!StringUtil.isEmpty(pErrMsg)) {
			context.setErrorMessage("执行存储过程异常,SQLCODE = " + pErrMsg);
			return -1;
		}
		
		ICacheTable spTb = dbProcedure.getResult();
		ICacheTable ratTb = new CacheTable(QueryExeRatDayZ1, "DTA_DTE,EXE_RAT");
		
		int count = spTb.getRecordCount();
		if(count>0){
			for (int i = 0; i < count; i++) {
				ratTb.insert(spTb.getDate(i, "DTA_DTE"),spTb.getBigDecimal(i, "EXE_RAT"));
			}
		}
		
		context.addOutputData(ratTb);
		return 0;
	}
}

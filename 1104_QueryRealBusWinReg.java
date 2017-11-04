package com.cmb.bus.busmonitor.operation;

import java.util.HashSet;
import java.util.Set;

import com.cmb.bus.common.util.Branch;
import com.cmb.bus.common.util.Common;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBTable;

/***
 * 窗口区域实时业务量查询
 * 输入：BRN_NBR-机构（分行或排班组）
 * 输出：BRN_NBR-支行、BRN_NAM-支行名称、COM_CNT-普通窗业务量、VIP_CNT-贵宾窗业务量、CMP_CNT-对公业务量、OTH_CNT-其他业务量
*/
public class QueryRealBusWinReg implements IOperation {
	public static final String QueryRealBusWinRegX1 = "QueryRealBusWinRegX1";
	public static final String QueryRealBusWinRegZ1 = "QueryRealBusWinRegZ1";
   
	@Override
	public int execute(IContext context) throws FrameworkException {
		
		ICacheTable input = context.getInputData().get(QueryRealBusWinRegX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		String brnNbr = input.getSqlString(0, "BRN_NBR");

		boolean allBranchFlag = false;
		Set<String> brnNbrs = new HashSet<String>();
		
		if (Branch.CMBCORNBR.equals(brnNbr) ) {
			allBranchFlag = true;
			context.setErrorMessage("输入机构不支持查询全行");
			return -1;
		} else {
			brnNbrs.addAll(Branch.getChildrens(brnNbr));
		}
		
		if (!allBranchFlag && brnNbrs.isEmpty() || brnNbrs.size() > 1000) {
			context.setErrorMessage("解析机构异常，机构ID=" + brnNbr);
			return -1;
		}
		
		String sql = 
				"SELECT SUM(CASE WHEN SVR_REG = '2' THEN SUM_CNT ELSE 0 END) AS COM_CNT, "
				+ "     SUM(CASE WHEN SVR_REG = '1' THEN SUM_CNT ELSE 0 END) AS VIP_CNT, "
				+ "     SUM(CASE WHEN SVR_REG = '3' THEN SUM_CNT ELSE 0 END) AS CMP_CNT, "
				+ "     SUM(CASE WHEN SVR_REG NOT IN ('1','2','3') THEN SUM_CNT ELSE 0 END) AS OTH_CNT, "
				+ "     BRN_NBR  "
				+ "FROM BUS.REAL "
				+ "WHERE DTA_DTE = CURRENT DATE ";
		if(!allBranchFlag){
			sql += "AND BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
		}
		sql += "GROUP BY BRN_NBR WITH UR ";
		
		ICacheTable result = new DBTable(context.getConnection(), QueryRealBusWinRegZ1, sql).select();

		result.addField("BRN_NAM");
		for (int i = 0; i < result.getRecordCount(); i++) {
			result.update(i, "BRN_NAM", Branch.getName(result.getString(i, "BRN_NBR")));
		}
	
		context.addOutputData(result);
		return 0;
	}
}

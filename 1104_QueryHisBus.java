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
 * 历史业务量查询
 * 输入：YEAR-年份、BRN_NBR-机构、SUM_LVL-汇总级别、ORD_COL-排序字段
 * 输出：BRN_NBR-机构、BRN_NAM-机构名称、AVG_CNT-日均业务量、SUM_CNT-累计业务量
*/
public class QueryHisBus implements IOperation {
	public static final String QueryHisBusX1 = "QueryHisBusX1";
	public static final String QueryHisBusZ1 = "QueryHisBusZ1";
   
	@Override
	public int execute(IContext context) throws FrameworkException {
		
		ICacheTable input = context.getInputData().get(QueryHisBusX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		String year = input.getSqlString(0, "YEAR");
		String brnNbr = input.getSqlString(0, "BRN_NBR");
		String sumLvl = input.getSqlString(0, "SUM_LVL");
		String ordCol = input.getSqlString(0, "ORD_COL");
		
		boolean allBranchFlag = false;
		Set<String> brnNbrs = new HashSet<String>();
		if ("100".equals(brnNbr) ) {
			allBranchFlag = true;
		} else {
			brnNbrs.addAll(Branch.getChildrens(brnNbr));
		}
		
		if (!allBranchFlag && brnNbrs.isEmpty() || brnNbrs.size() > 1000) {
			context.setErrorMessage("解析机构异常，机构ID=" + brnNbr);
			return -1;
		}

		String sql = "";
		if("CMB".equals(sumLvl)){
			sql = "SELECT '100' AS BRN_NBR,SUM(AVG_CNT) AS AVG_CNT,SUM(SUM_CNT) AS SUM_CNT FROM BUS.HISTORY A WHERE DTA_YER='" + year + "' ";
			if(!allBranchFlag){
				sql += "AND A.BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
			}
		}else if("BBK1".equals(sumLvl)){
			sql = "SELECT BBK_NBR AS BRN_NBR,SUM(AVG_CNT) AS AVG_CNT,SUM(SUM_CNT) AS SUM_CNT FROM BUS.HISTORY A WHERE DTA_YER='" + year + "' ";
			if(!allBranchFlag){
				sql += "AND A.BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
			}
			sql += "GROUP BY BBK_NBR ";
		}else if("GRP".equals(sumLvl)){
			sql = "SELECT B.GRP_NBR AS BRN_NBR,SUM(A.AVG_CNT) AS AVG_CNT,SUM(A.SUM_CNT) AS SUM_CNT "
					+ "FROM BUS.HISTORY A "
					+ "INNER JOIN SCH.Q2SCGPBR B "
					+ "      ON A.BRN_NBR = B.BRN_NBR "
					+ "INNER JOIN SCH.Q2SCGPDA C ON B.GRP_NBR=C.GRP_NBR AND C.GRP_STS='A' "
					+ "WHERE A.DTA_YER='" + year + "' ";
			if(!allBranchFlag){
				sql += "AND A.BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
			}
			sql += "GROUP BY B.GRP_NBR ";
		}else if("BRN".equals(sumLvl)){
			sql = "SELECT BRN_NBR,AVG_CNT,SUM_CNT FROM BUS.HISTORY A WHERE DTA_YER='" + year + "' ";
			if(!allBranchFlag){
				sql += "AND A.BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
			}
		}
		if("AVG_CNT".equals(ordCol)){
			sql += "ORDER BY 2 DESC ";
		}else if("SUM_CNT".equals(ordCol)){
			sql += "ORDER BY 3 DESC ";
		}else{
			sql += "ORDER BY 1";
		}
		
		ICacheTable result = new DBTable(context.getConnection(), QueryHisBusZ1, sql).select();
		result.addField("BRN_NAM");
		for (int i = 0; i < result.getRecordCount(); i++) {
			result.update(i, "BRN_NAM", Branch.getName(result.getString(i, "BRN_NBR")));
		}
	
		context.addOutputData(result);
		return 0;
	}
}

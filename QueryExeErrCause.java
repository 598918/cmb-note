package com.cmb.bus.busmonitor.operation;

import java.sql.Date;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

import com.cmb.bus.common.util.Branch;
import com.cmb.bus.common.util.Common;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBTable;

/**
 * 执行率异常原因的查询
 * @author WS02504
 * 输入 : 日期[DTA_MON],支行编号[BRN_NBR]
 * 输出 : 全字段
 */
public class QueryExeErrCause implements IOperation {
	private static final String QueryExeErrCauseX1 = "QueryExeErrCauseX1";
	private static final String QueryExeErrCauseZ1 = "QueryExeErrCauseZ1";
	
	@Override
	public int execute(IContext context) throws FrameworkException {
		ICacheTable input = context.getInputData().get(QueryExeErrCauseX1);
		if (input == null || input.getRecordCount() < 1) {
			context.setErrorMessage("输入参数不能为空");
			return -1;
		}
		
		//日期(YYYY-MM)与支行编号
		String dtaMon = input.getString(0, "DTA_MON");
		String brnNbr = input.getString(0, "BRN_NBR");
		
		Date strDte = Date.valueOf(dtaMon + "-01");
		Date endDte = getLastDayOfMonth(strDte);

		Set<String> brnNbrs = new HashSet<String>();
		if(Branch.isGroup(brnNbr)){
			brnNbrs = Branch.getGroupBrn(brnNbr);
		}else{
			brnNbrs.add(brnNbr);
		}
		
		if (brnNbrs.isEmpty() || brnNbrs.size() > 1000) {
			context.setErrorMessage("解析机构异常或不支持该机构的查询，机构ID=" + brnNbr);
			return -1;
		}
		
		String sqlForQry = "SELECT * FROM SCH.EXE_ERR_CAUSE WHERE DTA_DTE BETWEEN ? AND ? "
				+ "AND BRN_NBR IN (" + Common.set2String(brnNbrs) + ") ";
		
		//执行查询
		ICacheTable errorTb = new DBTable(context.getConnection(), QueryExeErrCauseZ1, sqlForQry, strDte, endDte).select();
		
		//添加机构名称
		errorTb.addField("BRN_NAM");
		for (int i = 0; i < errorTb.getRecordCount(); i++) {
			errorTb.update(i, "BRN_NAM", Branch.getName(errorTb.getString(i, "BRN_NBR")));
		}
		
		//返回结果
		context.addOutputData(errorTb);
		
		return 0;
	}
	
	private static Date getLastDayOfMonth(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.add(Calendar.MONTH, 1);
		cal.add(Calendar.DATE, -1);
		return new Date(cal.getTime().getTime());
	}

}
